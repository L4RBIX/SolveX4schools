import type { LessonBlock, SkillId } from "./types";
import { MONTHS } from "./months";
import { SKILL_BY_ID } from "./skills";

/**
 * Which Python the learner has actually met.
 *
 * ## The defect this closes
 *
 * Nova is handed a month title, a lesson title, a block prompt, the block's
 * code and its `skillRefs`. None of that says which Python *constructs* the
 * learner has been shown, so a level-4 hint on a September task could reach for
 * `abs()`, a `for` loop, a list comprehension or a helper function — none of
 * which September teaches. Recorded as open in
 * `docs/audits/SEPTEMBER_REMEDIATION_REPORT.md` §7 and §10.
 *
 * ## Why this is derived and not a list
 *
 * The obvious fix is a hand-written table: "September = print, input, int, if".
 * That table is a second curriculum. It agrees with the first one on the day it
 * is written and then silently stops agreeing, and nothing fails when it does —
 * the only symptom is a hint that reaches for something the learner has never
 * seen, which is exactly the bug being fixed.
 *
 * So the availability set is COMPUTED. The curriculum is walked in teaching
 * order — months → units → lessons → blocks, then the month's assessment — and
 * every construct is extracted from the Python the learner has actually been
 * SHOWN by that point: `concept.code`, `worked_example.code`, prediction and
 * trace code, both halves of a `find_bug` (the repaired program is revealed —
 * see `revealFor`), reorder lines, a `fill_blank` template with its answers
 * substituted in, a `modify_code` starting program, a `write_code` starter, a
 * `test_case` program, an assessment's program under repair.
 *
 * Reference solutions are deliberately NOT part of availability: the learner
 * never sees them. They are extracted separately, per block, as `taskGap` —
 * see below.
 *
 * ## Where declaration was unavoidable, and what validates it
 *
 * Months 2–9 carry their structure but their lesson bodies are unauthored, so
 * they contain **zero lines of Python**. "A `for` loop arrives in October"
 * therefore cannot be derived from October's code, because October has none.
 *
 * `ARRIVES_LATER` below is that declaration, and it is kept honest three ways:
 * it names a `SkillId` rather than a month number, so the month comes from
 * `skills.ts` (which is itself derived from the programme PDF) and cannot drift
 * from it; every entry carries a written justification; and
 * `validateArrivalDeclarations()` refuses any declaration whose construct
 * already appears in code shown BEFORE the month it claims to arrive in. A
 * declaration that contradicts the curriculum is an error, not a preference.
 *
 * Everything else — what is available, what the programme has never shown,
 * what a specific task's own solution needs — is computed.
 *
 * ## What this module is not
 *
 * It does not decide how much help Nova may give (`grantHintLevel` does) and it
 * produces no claim about the learner. "The curriculum has shown this construct
 * by this point" is a fact about the CONTENT. Whether the learner understood it
 * is a different question that nothing here answers or pretends to.
 */

/* -------------------------------------------------------------------------- */
/* The construct vocabulary                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Grouping, used only to keep the rendered prompt readable. A model reading
 * "print(), input(), int()" under "builtins" follows it more reliably than the
 * same names scattered through forty comma-separated items.
 */
export type ConstructGroup =
  | "statement"
  | "operator"
  | "comparison"
  | "logic"
  | "builtin"
  | "method"
  | "literal"
  | "expression";

export interface ConstructSpec {
  id: string;
  /**
   * How the construct is named in the system prompt. English on purpose: the
   * prompt already instructs Nova that programming keywords stay English in
   * both interface languages, and `for` translated into Kazakh is a language
   * that does not exist.
   */
  label: string;
  group: ConstructGroup;
}

/**
 * Every construct the extractor can recognise.
 *
 * This list is the extractor's alphabet, and its completeness matters in one
 * direction only: a construct that is missing here is invisible to the
 * extractor, so it can neither be reported as available nor as forbidden. It is
 * therefore deliberately wider than anything September uses — the point is to
 * be able to say "no code this course shows uses `sorted()`", which requires
 * knowing `sorted()` exists in the first place.
 */
const SPECS = [
  /* --- statements ----------------------------------------------------- */
  { id: "stmt.assign", label: "assignment (x = ...)", group: "statement" },
  { id: "stmt.assign_unpack", label: "multiple assignment (a, b = ...)", group: "statement" },
  { id: "stmt.assign_augmented", label: "augmented assignment (x += ...)", group: "statement" },
  { id: "stmt.if", label: "if", group: "statement" },
  { id: "stmt.elif", label: "elif", group: "statement" },
  { id: "stmt.else", label: "else", group: "statement" },
  { id: "stmt.for", label: "for loop", group: "statement" },
  { id: "stmt.while", label: "while loop", group: "statement" },
  { id: "stmt.break", label: "break", group: "statement" },
  { id: "stmt.continue", label: "continue", group: "statement" },
  { id: "stmt.def", label: "def (defining a function)", group: "statement" },
  { id: "stmt.return", label: "return", group: "statement" },
  { id: "stmt.import", label: "import", group: "statement" },
  { id: "stmt.try", label: "try / except", group: "statement" },
  { id: "stmt.class", label: "class", group: "statement" },
  { id: "stmt.with", label: "with", group: "statement" },
  { id: "stmt.global", label: "global / nonlocal", group: "statement" },
  { id: "stmt.pass", label: "pass", group: "statement" },
  { id: "stmt.del", label: "del", group: "statement" },
  { id: "stmt.assert", label: "assert", group: "statement" },
  { id: "stmt.raise", label: "raise", group: "statement" },

  /* --- arithmetic ------------------------------------------------------ */
  { id: "op.add", label: "+", group: "operator" },
  { id: "op.sub", label: "-", group: "operator" },
  { id: "op.mul", label: "*", group: "operator" },
  { id: "op.truediv", label: "/", group: "operator" },
  { id: "op.floordiv", label: "// (integer division)", group: "operator" },
  { id: "op.mod", label: "% (remainder)", group: "operator" },
  { id: "op.pow", label: "**", group: "operator" },

  /* --- comparison ------------------------------------------------------ */
  { id: "cmp.eq", label: "==", group: "comparison" },
  { id: "cmp.ne", label: "!=", group: "comparison" },
  { id: "cmp.lt", label: "<", group: "comparison" },
  { id: "cmp.gt", label: ">", group: "comparison" },
  { id: "cmp.le", label: "<=", group: "comparison" },
  { id: "cmp.ge", label: ">=", group: "comparison" },
  { id: "cmp.chained", label: "chained comparison (a < x < b)", group: "comparison" },

  /* --- logic ----------------------------------------------------------- */
  { id: "logic.and", label: "and", group: "logic" },
  { id: "logic.or", label: "or", group: "logic" },
  { id: "logic.not", label: "not", group: "logic" },
  { id: "logic.in", label: "in / not in", group: "logic" },
  { id: "logic.is", label: "is", group: "logic" },

  /* --- builtins -------------------------------------------------------- */
  { id: "builtin.print", label: "print()", group: "builtin" },
  { id: "builtin.input", label: "input()", group: "builtin" },
  { id: "builtin.int", label: "int()", group: "builtin" },
  { id: "builtin.float", label: "float()", group: "builtin" },
  { id: "builtin.str", label: "str()", group: "builtin" },
  { id: "builtin.bool", label: "bool()", group: "builtin" },
  { id: "builtin.map", label: "map()", group: "builtin" },
  { id: "builtin.len", label: "len()", group: "builtin" },
  { id: "builtin.range", label: "range()", group: "builtin" },
  { id: "builtin.abs", label: "abs()", group: "builtin" },
  { id: "builtin.min", label: "min()", group: "builtin" },
  { id: "builtin.max", label: "max()", group: "builtin" },
  { id: "builtin.sum", label: "sum()", group: "builtin" },
  { id: "builtin.sorted", label: "sorted()", group: "builtin" },
  { id: "builtin.reversed", label: "reversed()", group: "builtin" },
  { id: "builtin.list", label: "list()", group: "builtin" },
  { id: "builtin.tuple", label: "tuple()", group: "builtin" },
  { id: "builtin.set", label: "set()", group: "builtin" },
  { id: "builtin.dict", label: "dict()", group: "builtin" },
  { id: "builtin.zip", label: "zip()", group: "builtin" },
  { id: "builtin.filter", label: "filter()", group: "builtin" },
  { id: "builtin.enumerate", label: "enumerate()", group: "builtin" },
  { id: "builtin.round", label: "round()", group: "builtin" },
  { id: "builtin.divmod", label: "divmod()", group: "builtin" },
  { id: "builtin.pow", label: "pow()", group: "builtin" },
  { id: "builtin.any", label: "any()", group: "builtin" },
  { id: "builtin.all", label: "all()", group: "builtin" },
  { id: "builtin.ord", label: "ord()", group: "builtin" },
  { id: "builtin.chr", label: "chr()", group: "builtin" },
  { id: "builtin.type", label: "type()", group: "builtin" },
  { id: "builtin.eval", label: "eval()", group: "builtin" },

  /* --- methods --------------------------------------------------------- */
  { id: "method.split", label: ".split()", group: "method" },
  { id: "method.strip", label: ".strip()", group: "method" },
  { id: "method.join", label: ".join()", group: "method" },
  { id: "method.append", label: ".append()", group: "method" },
  { id: "method.pop", label: ".pop()", group: "method" },
  { id: "method.insert", label: ".insert()", group: "method" },
  { id: "method.remove", label: ".remove()", group: "method" },
  { id: "method.sort", label: ".sort()", group: "method" },
  { id: "method.index", label: ".index()", group: "method" },
  { id: "method.count", label: ".count()", group: "method" },
  { id: "method.upper", label: ".upper() / .lower()", group: "method" },
  { id: "method.replace", label: ".replace()", group: "method" },
  { id: "method.format", label: ".format()", group: "method" },
  { id: "method.items", label: ".items() / .keys() / .values()", group: "method" },

  /* --- literals -------------------------------------------------------- */
  { id: "literal.int", label: "whole numbers", group: "literal" },
  { id: "literal.float", label: "decimal numbers (3.5)", group: "literal" },
  { id: "literal.str", label: "text in quotes", group: "literal" },
  { id: "literal.fstring", label: "f-strings", group: "literal" },
  { id: "literal.bool", label: "True / False", group: "literal" },
  { id: "literal.none", label: "None", group: "literal" },
  { id: "literal.list", label: "a list ([1, 2, 3])", group: "literal" },
  { id: "literal.dict", label: "a dict or set ({...})", group: "literal" },

  /* --- expressions ----------------------------------------------------- */
  { id: "expr.subscript", label: "indexing (x[i])", group: "expression" },
  { id: "expr.slice", label: "slicing (x[a:b])", group: "expression" },
  { id: "expr.comprehension", label: "comprehension ([... for ... in ...])", group: "expression" },
  { id: "expr.ternary", label: "conditional expression (a if c else b)", group: "expression" },
  { id: "expr.lambda", label: "lambda", group: "expression" },
] as const satisfies readonly ConstructSpec[];

export type ConstructId = (typeof SPECS)[number]["id"];

export const CONSTRUCTS: readonly ConstructSpec[] = SPECS;

const SPEC_BY_ID = new Map<string, ConstructSpec>(SPECS.map((s) => [s.id, s]));

/** Rendering order inside the prompt. Groups, not alphabetical. */
const GROUP_ORDER: ConstructGroup[] = [
  "statement",
  "operator",
  "comparison",
  "logic",
  "builtin",
  "method",
  "literal",
  "expression",
];

function specOrder(a: ConstructSpec, b: ConstructSpec): number {
  const g = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
  return g !== 0 ? g : SPECS.findIndex((s) => s.id === a.id) - SPECS.findIndex((s) => s.id === b.id);
}

function specsOf(ids: Iterable<string>): ConstructSpec[] {
  const out: ConstructSpec[] = [];
  for (const id of ids) {
    const s = SPEC_BY_ID.get(id);
    if (s) out.push(s);
  }
  return out.sort(specOrder);
}

/* -------------------------------------------------------------------------- */
/* The extractor                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A sentinel that stands in for a string literal after masking.
 *
 * It has to survive as ONE token so `print("a" + "b")` keeps its `+`, and it
 * must not look like an identifier, a number or an operator — otherwise the
 * operator scanner and the call regex would both trip over it. U+0001 is not
 * legal Python source, so nothing real can collide with it.
 */
const STR = "\u0001";

interface Masked {
  /** Source with comments blanked and string bodies collapsed to `STR`. */
  text: string;
  sawString: boolean;
  sawFString: boolean;
}

/**
 * Strip comments and string bodies.
 *
 * This is the half of the extractor that has to be right. Without it,
 * `print("if x > 5")` reports `if` and `>` as taught, and `m1.l7.b1` — a
 * concept block whose entire body is the Kazakh comment
 * `# if x >= 10 → 9, 10, 11 үшін тексер` — would introduce conditionals a
 * lesson early, from a line that contains no Python at all.
 */
function mask(source: string): Masked {
  let out = "";
  let sawString = false;
  let sawFString = false;
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (ch === "#") {
      // Comment: everything to the newline goes, the newline stays.
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      /* A prefix (f, r, b, u, and their combinations) sits immediately before
         the quote and is part of the literal. It has already been emitted as an
         identifier, so it is taken back off `out` here rather than looked
         ahead for. */
      let prefixLen = 0;
      while (prefixLen < 3 && /[fFrRbBuU]/.test(out[out.length - 1 - prefixLen] ?? "")) {
        prefixLen += 1;
      }
      const prefix = prefixLen > 0 ? out.slice(out.length - prefixLen) : "";
      // A prefix only counts when it is a whole token, not the tail of a name.
      const beforePrefix = out[out.length - prefixLen - 1] ?? "";
      const isPrefix = prefixLen > 0 && !/[A-Za-z0-9_]/.test(beforePrefix);
      if (isPrefix) {
        out = out.slice(0, out.length - prefixLen);
        if (/[fF]/.test(prefix)) sawFString = true;
      }

      const triple = source.slice(i, i + 3);
      const quote = triple === '"""' || triple === "'''" ? triple : ch;
      i += quote.length;
      while (i < source.length) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source.startsWith(quote, i)) {
          i += quote.length;
          break;
        }
        // Newlines inside a triple-quoted string are dropped with the rest of
        // the body; line structure only matters outside literals.
        i += 1;
      }
      out += STR;
      sawString = true;
      continue;
    }

    out += ch;
    i += 1;
  }

  return { text: out, sawString, sawFString };
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(`(^|[^A-Za-z0-9_])${word}(?![A-Za-z0-9_])`).test(text);
}

/** Longest match first, or `<=` reports `<` and `=` and invents an assignment. */
const OPERATORS: { token: string; ids: ConstructId[] }[] = [
  { token: "//=", ids: ["stmt.assign_augmented", "op.floordiv"] },
  { token: "**=", ids: ["stmt.assign_augmented", "op.pow"] },
  { token: "+=", ids: ["stmt.assign_augmented", "op.add"] },
  { token: "-=", ids: ["stmt.assign_augmented", "op.sub"] },
  { token: "*=", ids: ["stmt.assign_augmented", "op.mul"] },
  { token: "/=", ids: ["stmt.assign_augmented", "op.truediv"] },
  { token: "%=", ids: ["stmt.assign_augmented", "op.mod"] },
  { token: "==", ids: ["cmp.eq"] },
  { token: "!=", ids: ["cmp.ne"] },
  { token: "<=", ids: ["cmp.le"] },
  { token: ">=", ids: ["cmp.ge"] },
  { token: "//", ids: ["op.floordiv"] },
  { token: "**", ids: ["op.pow"] },
  { token: "<", ids: ["cmp.lt"] },
  { token: ">", ids: ["cmp.gt"] },
  { token: "=", ids: ["stmt.assign"] },
  { token: "+", ids: ["op.add"] },
  { token: "-", ids: ["op.sub"] },
  { token: "*", ids: ["op.mul"] },
  { token: "/", ids: ["op.truediv"] },
  { token: "%", ids: ["op.mod"] },
];

const KEYWORDS: { word: string; id: ConstructId }[] = [
  { word: "if", id: "stmt.if" },
  { word: "elif", id: "stmt.elif" },
  { word: "else", id: "stmt.else" },
  { word: "for", id: "stmt.for" },
  { word: "while", id: "stmt.while" },
  { word: "break", id: "stmt.break" },
  { word: "continue", id: "stmt.continue" },
  { word: "def", id: "stmt.def" },
  { word: "return", id: "stmt.return" },
  { word: "import", id: "stmt.import" },
  { word: "try", id: "stmt.try" },
  { word: "except", id: "stmt.try" },
  { word: "class", id: "stmt.class" },
  { word: "with", id: "stmt.with" },
  { word: "global", id: "stmt.global" },
  { word: "nonlocal", id: "stmt.global" },
  { word: "pass", id: "stmt.pass" },
  { word: "del", id: "stmt.del" },
  { word: "assert", id: "stmt.assert" },
  { word: "raise", id: "stmt.raise" },
  { word: "and", id: "logic.and" },
  { word: "or", id: "logic.or" },
  { word: "not", id: "logic.not" },
  { word: "in", id: "logic.in" },
  { word: "is", id: "logic.is" },
  { word: "lambda", id: "expr.lambda" },
  { word: "True", id: "literal.bool" },
  { word: "False", id: "literal.bool" },
  { word: "None", id: "literal.none" },
];

/** Call name → construct. A name absent from here is a variable or a helper. */
const BUILTIN_CALLS: Record<string, ConstructId> = {
  print: "builtin.print",
  input: "builtin.input",
  int: "builtin.int",
  float: "builtin.float",
  str: "builtin.str",
  bool: "builtin.bool",
  map: "builtin.map",
  len: "builtin.len",
  range: "builtin.range",
  abs: "builtin.abs",
  min: "builtin.min",
  max: "builtin.max",
  sum: "builtin.sum",
  sorted: "builtin.sorted",
  reversed: "builtin.reversed",
  list: "builtin.list",
  tuple: "builtin.tuple",
  set: "builtin.set",
  dict: "builtin.dict",
  zip: "builtin.zip",
  filter: "builtin.filter",
  enumerate: "builtin.enumerate",
  round: "builtin.round",
  divmod: "builtin.divmod",
  pow: "builtin.pow",
  any: "builtin.any",
  all: "builtin.all",
  ord: "builtin.ord",
  chr: "builtin.chr",
  type: "builtin.type",
  eval: "builtin.eval",
};

const METHOD_CALLS: Record<string, ConstructId> = {
  split: "method.split",
  strip: "method.strip",
  rstrip: "method.strip",
  lstrip: "method.strip",
  join: "method.join",
  append: "method.append",
  extend: "method.append",
  pop: "method.pop",
  insert: "method.insert",
  remove: "method.remove",
  sort: "method.sort",
  index: "method.index",
  count: "method.count",
  upper: "method.upper",
  lower: "method.upper",
  replace: "method.replace",
  format: "method.format",
  items: "method.items",
  keys: "method.items",
  values: "method.items",
};

/**
 * Every construct a snippet of Python uses.
 *
 * Not a parser. A parser would be better and is not available in this runtime,
 * so this is a masked-source scanner, and its two directions of error are not
 * symmetric.
 *
 * MISSING a construct in curriculum code is the harmless direction: the set of
 * available constructs comes out too small, so Nova is told to use less than
 * the learner has actually seen. INVENTING one is the harmful direction: it
 * widens `available`, and Nova gets told a construct is taught when it is not —
 * the exact bug this module exists to fix. Which is why masking comes first and
 * why `tests/nova/construct-context.test.ts` pins September's computed set
 * item by item rather than checking that it is non-empty.
 */
export function extractConstructs(source: string): Set<ConstructId> {
  const found = new Set<ConstructId>();
  const m = mask(source);
  const text = m.text;

  if (m.sawString) found.add("literal.str");
  if (m.sawFString) found.add("literal.fstring");

  for (const { word, id } of KEYWORDS) {
    if (hasWord(text, word)) found.add(id);
  }

  /* `for` inside brackets is a comprehension, and it is worth naming
     separately: "you may not write a loop" and "you may not write a
     comprehension" are the same rule, but a model told only the first one
     writes the second. Bracket MATCHING rather than a regex, because
     `[int(x) for x in s]` has a nested `(...)` in it and a flat character-class
     pattern stops at the first inner bracket — which is how the most likely
     comprehension in this course would have slipped through. */
  for (let i = 0; i < text.length; i += 1) {
    if (!"[({".includes(text[i])) continue;
    const close = matchingBracket(text, i);
    if (close < 0) continue;
    if (hasWord(text.slice(i + 1, close), "for")) {
      found.add("expr.comprehension");
      break;
    }
  }

  // Operator scan, longest match first.
  for (let i = 0; i < text.length; ) {
    let matched = false;
    for (const op of OPERATORS) {
      if (text.startsWith(op.token, i)) {
        for (const id of op.ids) found.add(id);
        i += op.token.length;
        matched = true;
        break;
      }
    }
    if (!matched) i += 1;
  }

  // Calls. `.name(` is a method; a bare `name(` preceded by `def` is a
  // definition, not a call, and `def` is already reported as a keyword.
  for (const match of text.matchAll(/(\.\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
    const isMethod = Boolean(match[1]);
    const name = match[2];
    const id = isMethod ? METHOD_CALLS[name] : BUILTIN_CALLS[name];
    if (id) found.add(id);
  }

  /* `[` is either a subscript or a list literal, and the difference is what
     precedes it: `xs[0]` indexes, `[1, 2]` builds. Getting this backwards would
     make "lists are not taught yet" fire on code that never builds one. */
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "[") continue;
    let j = i - 1;
    while (j >= 0 && /\s/.test(text[j])) j -= 1;
    const prev = j >= 0 ? text[j] : "";
    const isSubscript = /[A-Za-z0-9_)\]]/.test(prev) || prev === STR;
    const close = matchingBracket(text, i);
    const inner = close > i ? text.slice(i + 1, close) : "";
    if (isSubscript) {
      found.add("expr.subscript");
      if (inner.includes(":")) found.add("expr.slice");
    } else {
      found.add("literal.list");
    }
  }

  if (text.includes("{")) found.add("literal.dict");

  /* A conditional expression is an `if` and an `else` on one line with no
     colon closing a block. September never writes one, and it is precisely the
     "shorter way" a language model offers unprompted. */
  for (const line of text.split("\n")) {
    if (hasWord(line, "if") && hasWord(line, "else") && !line.trimEnd().endsWith(":")) {
      found.add("expr.ternary");
    }
  }

  // Numbers. Floats first, or `3.5` reports two integers.
  let numeric = text;
  if (/\d+\.\d+/.test(numeric)) {
    found.add("literal.float");
    numeric = numeric.replace(/\d+\.\d+/g, " ");
  }
  if (/(^|[^A-Za-z0-9_.])\d+/.test(numeric)) found.add("literal.int");

  /* Tuple unpacking, per line: names separated by commas on the left of a
     single `=`. This is how every September program reads two numbers
     (`a, b = map(int, input().split())`), so it has to be a construct in its
     own right rather than folded into plain assignment. */
  for (const line of text.split("\n")) {
    if (/^\s*[A-Za-z_]\w*\s*(,\s*[A-Za-z_]\w*\s*)+=[^=]/.test(line)) {
      found.add("stmt.assign_unpack");
    }
  }

  /* Chained comparison: two comparison operators with no `and`/`or` between
     them. `10 <= x <= 20` is legal Python that September never teaches, and it
     appeared once as a multiple-choice distractor precisely because it looks
     natural to someone who already knows Python. */
  for (const line of text.split("\n")) {
    const ops = line.match(/<=|>=|==|!=|<|>/g);
    if (ops && ops.length >= 2 && !hasWord(line, "and") && !hasWord(line, "or")) {
      found.add("cmp.chained");
    }
  }

  return found;
}

const CLOSER: Record<string, string> = { "[": "]", "(": ")", "{": "}" };

/** Index of the bracket closing the one at `open`, or -1 if it is unbalanced. */
function matchingBracket(text: string, open: number): number {
  const opener = text[open];
  const closer = CLOSER[opener];
  if (!closer) return -1;
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === opener) depth += 1;
    else if (text[i] === closer) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/* -------------------------------------------------------------------------- */
/* Teaching order                                                             */
/* -------------------------------------------------------------------------- */

export interface OrderedBlock {
  block: LessonBlock;
  monthIndex: number;
  lessonId: string;
  /** Position in teaching order across the whole programme. 0-based. */
  ordinal: number;
}

let orderCache: OrderedBlock[] | null = null;

/**
 * Every block in the order a learner meets it.
 *
 * The array order in the month files IS the teaching order — that is what makes
 * this derivable at all. A month's assessment comes after its lessons, because
 * that is when it is sat.
 */
export function teachingOrder(): readonly OrderedBlock[] {
  if (orderCache) return orderCache;
  const out: OrderedBlock[] = [];
  for (const month of MONTHS) {
    for (const unit of month.units) {
      for (const lesson of unit.lessons) {
        for (const block of lesson.blocks) {
          out.push({ block, monthIndex: month.index, lessonId: lesson.id, ordinal: out.length });
        }
      }
    }
    if (month.assessment) {
      for (const block of month.assessment.blocks) {
        out.push({
          block,
          monthIndex: month.index,
          lessonId: month.assessment.id,
          ordinal: out.length,
        });
      }
    }
  }
  orderCache = out;
  return out;
}

/**
 * The Python this block puts in front of the learner.
 *
 * The distinction that matters is SHOWN versus CORRECT. A reference solution is
 * correct and invisible; extracting from it would report a construct as taught
 * because a task's answer happened to use it, which is the opposite of the
 * question being asked.
 */
export function shownCode(block: LessonBlock): string[] {
  switch (block.type) {
    case "concept":
      return block.code ? [block.code] : [];
    case "worked_example":
      return [block.code];
    case "prediction":
      return [block.code];
    case "multiple_choice":
      return block.code ? [block.code] : [];
    case "trace_code":
      return [block.code];
    case "reorder_code":
      // Shuffled on screen, but every line is on screen.
      return [block.lines.map((l) => l.code).join("\n")];
    case "fill_blank":
      // The template with `___` in it is not Python. Filled in, it is — and the
      // filled-in form is what `revealFor` shows.
      return [fillTemplate(block.template, block.blanks.map((b) => b.answer))];
    case "find_bug":
      // Both: the broken program is on screen, and the repaired one is revealed
      // by `revealFor` on a correct answer as well as after enough failures.
      return [block.code, block.fixedCode];
    case "modify_code":
      return [block.code];
    case "write_code":
      return block.starter ? [block.starter] : [];
    case "test_case":
      return [block.code];
    case "verify": {
      const out: string[] = [];
      if (block.code) out.push(block.code);
      if (block.starter) out.push(block.starter);
      return out;
    }
    default:
      return [];
  }
}

/**
 * The Python this block's answer needs, which the learner never sees.
 *
 * Read for one purpose: to notice when a task's own solution requires something
 * the curriculum has not shown. See `taskGap`.
 */
function hiddenCode(block: LessonBlock): string[] {
  switch (block.type) {
    case "write_code":
    case "modify_code":
    case "challenge":
      return [block.referenceSolution];
    case "find_bug":
      return [block.fixedCode];
    case "verify":
      return block.referenceSolution ? [block.referenceSolution] : [];
    default:
      return [];
  }
}

function fillTemplate(template: string, answers: string[]): string {
  let i = 0;
  return template.replace(/___/g, () => answers[i++] ?? "");
}

/* -------------------------------------------------------------------------- */
/* What arrives later — the one declaration, and its validator                */
/* -------------------------------------------------------------------------- */

export interface ArrivalDeclaration {
  construct: ConstructId;
  /**
   * The curriculum skill that introduces it. A `SkillId`, never a month number:
   * the month is read from `skills.ts`, which is derived from the programme
   * PDF, so this cannot drift away from the curriculum's own sequencing.
   */
  skill: SkillId;
  /** Why this construct belongs to that skill. Required: it forces the case. */
  why: string;
}

/**
 * Constructs the programme teaches later, and when.
 *
 * **This is the only hand-written thing in this file, and it exists because
 * months 2–9 contain no Python at all** — their lesson bodies are unauthored,
 * so "loops arrive in October" is not extractable from October. Everything
 * else here is computed.
 *
 * Every entry is checked by `validateArrivalDeclarations()`: the skill must
 * exist, the construct must exist, and the construct must be absent from every
 * line of code shown before the month the skill says it arrives in. When months
 * 2–9 are authored, that check turns from a formality into a real one, and a
 * declaration that has gone stale will fail rather than quietly mislead Nova.
 */
export const ARRIVES_LATER: readonly ArrivalDeclaration[] = [
  {
    construct: "stmt.for",
    skill: "loops.for",
    why: "The programme's own skill for the for loop, first taught in October (PDF p.7).",
  },
  {
    construct: "builtin.range",
    skill: "loops.for",
    why: "range() has no use in this programme except to drive a for loop, so it cannot precede one.",
  },
  {
    construct: "expr.comprehension",
    skill: "loops.for",
    why: "A comprehension is a for loop written as an expression. It cannot be available before the loop is.",
  },
  {
    construct: "stmt.while",
    skill: "loops.while",
    why: "The programme's own skill for the while loop (PDF p.7).",
  },
  {
    construct: "stmt.break",
    skill: "loops.while",
    why: "break has nothing to break out of until there is a loop.",
  },
  {
    construct: "stmt.continue",
    skill: "loops.while",
    why: "continue has nothing to continue until there is a loop.",
  },
  {
    construct: "literal.list",
    skill: "lists.index",
    why: "The programme introduces lists in October, indexing first (PDF p.7).",
  },
  {
    construct: "expr.subscript",
    skill: "lists.index",
    why: "«Тізім индексі» is exactly this construct.",
  },
  {
    construct: "builtin.list",
    skill: "lists.index",
    why: "Building a list by calling list() presupposes the list type.",
  },
  {
    construct: "builtin.len",
    skill: "lists.traverse",
    why: "len() appears in this programme to bound a traversal, which is the October skill «Тізімді толық қарап шығу».",
  },
  {
    construct: "expr.slice",
    skill: "strings.sequence",
    why: "Slicing arrives with «Жолды таңбалар тізбегі ретінде өңдеу» — treating a string as a sequence.",
  },
  {
    construct: "stmt.def",
    skill: "func.define",
    why: "«Функция жазу», November (PDF p.8).",
  },
  {
    construct: "stmt.return",
    skill: "func.return",
    why: "«return арқылы нәтиже қайтару», November (PDF p.8). return outside a function is a syntax error.",
  },
  {
    construct: "builtin.sorted",
    skill: "sort.basic",
    why: "Ordering numbers is the December skill «Сандарды реттеу» (PDF p.8).",
  },
  {
    construct: "method.sort",
    skill: "sort.basic",
    why: "The in-place half of the same December skill.",
  },
];

export interface DeclarationProblem {
  construct: string;
  problem: string;
}

/**
 * Refuse declarations that contradict the curriculum.
 *
 * Called by `tests/nova/construct-context.test.ts`. The failure it is looking
 * for is the one that makes hand-maintained tables dangerous: a construct
 * declared to arrive in month N that the content already shows in month N-1, so
 * Nova is told the learner has not met something they have been staring at for
 * a month.
 */
export function validateArrivalDeclarations(): DeclarationProblem[] {
  const problems: DeclarationProblem[] = [];
  const seen = new Set<string>();

  for (const decl of ARRIVES_LATER) {
    if (seen.has(decl.construct)) {
      problems.push({ construct: decl.construct, problem: "declared twice" });
    }
    seen.add(decl.construct);

    if (!SPEC_BY_ID.has(decl.construct)) {
      problems.push({ construct: decl.construct, problem: "not a construct the extractor knows" });
      continue;
    }
    if (!decl.why.trim()) {
      problems.push({ construct: decl.construct, problem: "no justification" });
    }

    const skill = SKILL_BY_ID.get(decl.skill);
    if (!skill) {
      problems.push({
        construct: decl.construct,
        problem: `names skill ${decl.skill}, which is not in the taxonomy`,
      });
      continue;
    }

    /* The real check. Everything shown strictly before the claimed month must
       not contain the construct — otherwise the declaration is false about the
       content it is describing. */
    const before = new Set<ConstructId>();
    for (const entry of teachingOrder()) {
      if (entry.monthIndex >= skill.introducedInMonth) break;
      for (const code of shownCode(entry.block)) {
        for (const id of extractConstructs(code)) before.add(id);
      }
    }
    if (before.has(decl.construct)) {
      problems.push({
        construct: decl.construct,
        problem:
          `declared to arrive in month ${skill.introducedInMonth} via ${decl.skill}, ` +
          "but the curriculum already shows it before then",
      });
    }
  }

  return problems;
}

/* -------------------------------------------------------------------------- */
/* The capability context                                                     */
/* -------------------------------------------------------------------------- */

export interface ArrivingConstruct {
  spec: ConstructSpec;
  month: number;
  /** The skill that brings it, so a reader can check the claim. */
  skill: SkillId;
}

export interface CapabilityContext {
  blockId: string;
  monthIndex: number;
  /** Everything the curriculum has shown, up to and including this block. */
  available: ConstructSpec[];
  /** Declared to arrive in a later month. Ordered by month. */
  arrivesLater: ArrivingConstruct[];
  /**
   * In the extractor's vocabulary, shown nowhere in the programme's code, and
   * not declared to arrive later. Fully derived — nobody lists these.
   *
   * The name is exact and the exactness matters. This is NOT "the programme
   * never teaches it": `compare.operators` is a September skill and plainly
   * covers `<=`, yet no line of code the learner is shown in September contains
   * one, so `<=` lands here. The claim being made is only ever "they have not
   * seen this written down", which is the claim the extraction supports. Saying
   * anything stronger in the prompt would be inventing curriculum.
   */
  neverShown: ConstructSpec[];
  /**
   * What this task's own reference solution needs that the curriculum has never
   * shown.
   *
   * Almost always empty, and when it is not, it is a finding rather than a
   * feature: `m1.p8` (clock angle) is solved with `abs()` and a decimal
   * literal, neither of which September ever puts on screen. Surfacing it is
   * the point — the alternative is Nova being forbidden from giving the level-4
   * fix to a task whose only sane fix needs the construct, and nobody ever
   * learning that the gap is there.
   */
  taskGap: ConstructSpec[];
}

let contextCache: Map<string, CapabilityContext> | null = null;

function buildContexts(): Map<string, CapabilityContext> {
  const order = teachingOrder();

  // Everything the programme shows anywhere, for the `neverShown` set.
  const shownEver = new Set<ConstructId>();
  for (const entry of order) {
    for (const code of shownCode(entry.block)) {
      for (const id of extractConstructs(code)) shownEver.add(id);
    }
  }

  const arrivals: ArrivingConstruct[] = [];
  for (const decl of ARRIVES_LATER) {
    const spec = SPEC_BY_ID.get(decl.construct);
    const skill = SKILL_BY_ID.get(decl.skill);
    if (!spec || !skill) continue; // reported by the validator, not swallowed here
    arrivals.push({ spec, month: skill.introducedInMonth, skill: decl.skill });
  }
  arrivals.sort((a, b) => a.month - b.month || specOrder(a.spec, b.spec));
  const declaredIds = new Set(arrivals.map((a) => a.spec.id));

  const neverShown = specsOf(
    SPECS.map((s) => s.id).filter((id) => !shownEver.has(id) && !declaredIds.has(id)),
  );

  const out = new Map<string, CapabilityContext>();
  const running = new Set<ConstructId>();

  for (const entry of order) {
    for (const code of shownCode(entry.block)) {
      for (const id of extractConstructs(code)) running.add(id);
    }

    const available = new Set(running);

    const gap = new Set<ConstructId>();
    for (const code of hiddenCode(entry.block)) {
      for (const id of extractConstructs(code)) {
        if (!available.has(id)) gap.add(id);
      }
    }

    out.set(entry.block.id, {
      blockId: entry.block.id,
      monthIndex: entry.monthIndex,
      available: specsOf(available),
      /* Only what has not landed yet. A construct already in `available`
         cannot also be "not taught" — that would happen if the declaration
         were wrong, and `validateArrivalDeclarations` is what catches it. */
      arrivesLater: arrivals.filter((a) => !available.has(a.spec.id as ConstructId)),
      neverShown: neverShown.filter((s) => !available.has(s.id as ConstructId)),
      taskGap: specsOf(gap),
    });
  }

  return out;
}

/**
 * The capability context for one block, or null if the id is unknown.
 *
 * Computed once for the whole programme and memoised: the curriculum is a
 * frozen module, so recomputing per hint request would burn CPU to produce the
 * same answer.
 */
export function capabilityFor(blockId: string): CapabilityContext | null {
  contextCache ??= buildContexts();
  return contextCache.get(blockId) ?? null;
}

/**
 * Constructs a snippet uses that the learner has not been shown.
 *
 * The runtime counterpart to the prompt constraints: the same extractor that
 * decided what is available decides whether a proposed solution stays inside
 * it, so the two cannot disagree. `taskGap` is allowed through, because a
 * task's own reference solution defines what that task requires.
 *
 * Pure, and takes the context rather than a block id, so a test can point it at
 * any snippet and any point in the curriculum.
 */
export function untaughtConstructsIn(code: string, ctx: CapabilityContext): ConstructSpec[] {
  const allowed = new Set<string>([
    ...ctx.available.map((s) => s.id),
    ...ctx.taskGap.map((s) => s.id),
  ]);
  return specsOf([...extractConstructs(code)].filter((id) => !allowed.has(id)));
}

/* -------------------------------------------------------------------------- */
/* Rendering into the system prompt                                           */
/* -------------------------------------------------------------------------- */

function joinLabels(specs: readonly { label: string }[]): string {
  return specs.map((s) => s.label).join(", ");
}

/** Marker the tests assert on, so "the constraint is present" is checkable. */
export const CAPABILITY_PROMPT_HEADING = "WHICH PYTHON THIS LEARNER HAS ACTUALLY BEEN TAUGHT";

export interface CapabilityPromptOptions {
  /**
   * Whether Nova may be told what this task's own solution needs beyond the
   * taught set.
   *
   * False below hint level 3. "This one needs abs()" is a substantial hint
   * about a task whose whole difficulty is spotting that, and the ladder exists
   * so that hints arrive in order. At 3 and 4 Nova is walking through the
   * reasoning or giving the fix, and withholding it there would force it to
   * either refuse or invent a worse solution.
   */
  includeTaskGap: boolean;
}

/**
 * The constraint, as prompt lines.
 *
 * Written as a closed positive list plus a blanket rule, rather than a list of
 * bans. A ban list is only as good as its author's imagination; "anything not
 * on this list is not taught" holds for constructs nobody thought of.
 */
export function capabilityPromptLines(
  ctx: CapabilityContext,
  opts: CapabilityPromptOptions,
): string[] {
  const lines: string[] = ["", CAPABILITY_PROMPT_HEADING];

  lines.push(
    "- This list is computed from every line of Python this curriculum has actually put",
    "  in front of them, up to and including this task. It is not a guess.",
    `- TAUGHT, so you may use it freely: ${joinLabels(ctx.available)}`,
  );

  if (ctx.arrivesLater.length) {
    lines.push(
      `- NOT TAUGHT YET — comes later in the year: ${ctx.arrivesLater
        .map((a) => `${a.spec.label} (month ${a.month})`)
        .join(", ")}`,
    );
  }
  if (ctx.neverShown.length) {
    lines.push(
      "- NEVER SHOWN — no code this course has put in front of them uses these, so treat",
      `  them as unavailable too: ${joinLabels(ctx.neverShown)}`,
    );
  }

  lines.push(
    "- The TAUGHT list is closed. Anything not on it — any other builtin, any other",
    "  method, any other syntax — counts as not taught, whether or not it is named above.",
    "",
    "WHAT THAT MEANS FOR YOUR ANSWER",
    "- Solve, fix, correct and demonstrate using the TAUGHT list ONLY. That applies to",
    "  every rung of the ladder, to code you write, to code you describe in words, and",
    "  to 'here is a shorter way' asides.",
    "- If the only solution you can see needs something untaught, you have the wrong",
    "  solution. Every task at this point in the course is solvable with the taught list.",
    "- If the learner ASKS what a loop, a list or a function is, you may explain what it",
    "  is in a sentence or two. Explaining is allowed. Solving this task with it is not.",
    "- Do not tell them their approach is wrong because it is long. A solution built from",
    "  what they have been taught is the correct solution here, not a worse one.",
  );

  if (opts.includeTaskGap && ctx.taskGap.length) {
    lines.push(
      `- EXCEPTION, this task only: its intended solution also needs ${joinLabels(ctx.taskGap)}.`,
      "  You may use those here, and only here. Explain them, because they have not been",
      "  taught — do not present them as something the learner should already know.",
    );
  }

  return lines;
}
