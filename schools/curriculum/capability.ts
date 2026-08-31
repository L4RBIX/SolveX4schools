import type { LessonBlock, SkillId } from "./types";
import { MONTHS } from "./months";
import { SKILL_BY_ID } from "./skills";

/**
 * Which code the learner has actually been shown.
 *
 * ## The defect this closes
 *
 * Nova is handed a month title, a lesson title, a block prompt, the block's
 * code and its `skillRefs`. None of that says which *constructs* the learner
 * has been shown, so a level-4 hint on a September task could reach for a `for`
 * loop, a `vector` or a helper function — none of which September teaches.
 * Recorded as open in `docs/audits/SEPTEMBER_REMEDIATION_REPORT.md` §7 and §10.
 *
 * ## The alphabet is C++17, and it had to be
 *
 * The course is C++17 (`YEAR_ONE_LANGUAGE`). Until this migration the scanner
 * was not: `SPECS`, `KEYWORDS`, `OPERATORS`, `BUILTIN_CALLS` and `mask()` were
 * written against Python and left walking C++, which does not fail quietly. It
 * produced FALSE PERMISSIONS, and the three worst were on `m1.l1.b1` — the
 * first program a fourteen-year-old ever sees:
 *
 *   - `cout << x` scanned as two `<`, so `<` and "chained comparison" were
 *     reported taught at lesson 1. September teaches comparison at lesson 8.
 *   - `int main() { }` contains a `{`, so "a dict or set" was reported taught.
 *   - `return 0;` in the given frame was reported as the learner's `return`,
 *     four lessons before they are asked to write one.
 *
 * Each of those was a paragraph of Nova's system prompt asserting permission to
 * use a construct the course had not taught, inside the section whose entire
 * purpose is to withhold exactly that. `schools/nova/prompt.ts` therefore
 * withheld the whole block behind `CAPABILITY_VOCABULARY_IS_PYTHON`, a constant
 * DETECTED by asking whether this module still exports `builtin.print` and
 * `stmt.elif`. Those ids are gone, so the gate opens on its own and the block
 * is back in the prompt with no edit there.
 *
 * ### How C++ is scanned, and the three rules that stop the lying
 *
 * Still not a parser — no parser is available in this runtime — but the
 * tokeniser now knows the things about C++ that a Python tokeniser got wrong:
 *
 *   1. **`<<` and `>>` are read before `<` and `>`.** They are stream
 *      operators, so `cout << x` reports output and NOT a comparison. Template
 *      argument lists (`vector<vector<int>>`) are matched and neutralised
 *      first, so the `>>` closing a nested `vector` is not read as `cin >>`
 *      either, and `#include <iostream>` never reaches the operator scan at
 *      all. What is left of `<` and `>` is genuinely relational.
 *   2. **`{` is a block delimiter, not a literal.** Brace INITIALISATION —
 *      a `{` sitting after `=`, `(`, `,` or another `{` — is a construct of its
 *      own (`expr.brace_init`); the braces of `int main() { }` are not.
 *   3. **Comments and literals go first.** `//`, and a slash-star pair, and
 *      `"..."`, and `'x'`. Without that, `cout << "a < b"` reports a
 *      comparison and a concept block whose body is a Kazakh comment reading
 *      `егер a > b болса` introduces conditionals a lesson early, out of a line
 *      containing no code. `tests/school/constructs-are-taught.test.ts` pins
 *      all three.
 *
 * ## THE FRAME IS GIVEN, NOT TAUGHT — and how that is represented here
 *
 * `docs/cpp17/CPP17_PEDAGOGY.md` is binding on this and it is the single most
 * important pedagogical fact in the month: `#include <iostream>`,
 * `using namespace std;`, `int main() { }` and `return 0;` are on screen from
 * lesson one and are NOT the learner's to write until the lesson that asks for
 * the whole program unaided. An extractor that reports them as "shown" is
 * technically right and pedagogically useless, because it lets Nova answer a
 * week-one learner with "just add a return statement".
 *
 * So the four frame constructs carry `givenAsScaffold: true`, and the choice
 * made here is:
 *
 *   **a scaffold construct is reported separately as `givenAsScaffold` — on
 *   screen, safe to point at, not theirs to write — and joins `available` only
 *   from the first block, in teaching order, that actually requires the learner
 *   to produce the frame without being given it.**
 *
 * That boundary is DERIVED, not declared: it is the first block whose reference
 * solution contains a frame construct that the block's own shown code does not.
 * A `write_code` with a starter containing `int main()` has given them the
 * frame; a `write_code` with no starter has not. It is the same distinction
 * `schools/nova/cpp17.ts` states as `taughtAt` versus `requiredAt` on its
 * `frame` row, and this module is deliberately aligned with that module rather
 * than restating its numbers: `cpp17.ts` declares the September SEQUENCE from
 * the pedagogy document, this walks the CONTENT, and where the two disagree
 * that disagreement is a finding about the content rather than a number to
 * reconcile in a comment.
 *
 * One such disagreement is live and is recorded here rather than smoothed over.
 * `cpp17.ts` puts the frame's `requiredAt` at l7 — the seventh lesson — and the
 * derived boundary is `m1.l10.b5`, which is the FOURTH lesson of September in
 * teaching order. (September's lesson ids are not its lesson order: the units
 * were re-sequenced and the ids were kept, so the month runs l1, l11, l2, l10,
 * l3, l4, l5, l12, l6, l7, l8, l9.) `m1.l10.b5` is a `write_code` with no
 * starter, so its editor opens empty and the learner types the frame. The
 * content, not this file, is what would have to change.
 *
 * ## Why this is derived and not a list
 *
 * The obvious fix is a hand-written table: "September = cout, cin, int, if".
 * That table is a second curriculum. It agrees with the first one on the day it
 * is written and then silently stops agreeing, and nothing fails when it does —
 * the only symptom is a hint that reaches for something the learner has never
 * seen, which is exactly the bug being fixed.
 *
 * So the availability set is COMPUTED. The curriculum is walked in teaching
 * order — months → units → lessons → blocks, then the month's assessment — and
 * every construct is extracted from the code the learner has actually been
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
 * ## Where declaration used to be unavoidable, and why it no longer is
 *
 * `ARRIVES_LATER` used to carry fifteen entries and the reason was stated in
 * this header: months 2–9 held their structure but their lesson bodies were
 * unauthored, so they contained **zero lines of code** and "a `for` loop
 * arrives in October" could not be derived from October.
 *
 * That is no longer true. All nine months carry authored code, so the month a
 * construct first appears in is a fact about the tree, `firstShownMonth()`
 * reads it, and `arrivesLater` is computed from it. Every one of the fifteen
 * was re-checked against the content and deleted; for each that still has a
 * C++ counterpart the derived month is the SAME month the declaration's skill
 * named, which is the evidence that the declaration had stopped carrying
 * information. The list beside `ARRIVES_LATER` below is that check, written
 * down, so nobody has to redo it to find out whether it was done.
 *
 * The mechanism stays because the reason for it might come back: a construct
 * the programme teaches and genuinely never writes as code would need one.
 * `validateArrivalDeclarations()` refuses any declaration whose construct
 * already appears in code shown BEFORE the month it claims to arrive in, and
 * every entry must name a `SkillId` rather than a month number, so the month
 * comes from `skills.ts` — itself derived from the programme PDF — and cannot
 * drift from it. A declaration that contradicts the curriculum is an error,
 * not a preference.
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
 * three names under one "containers" heading follows it more reliably than the
 * same names scattered through ninety comma-separated items.
 */
export type ConstructGroup =
  | "frame"
  | "io"
  | "type"
  | "statement"
  | "operator"
  | "comparison"
  | "logic"
  | "function"
  | "container"
  | "method"
  | "library"
  | "literal"
  | "expression"
  | "excluded";

export interface ConstructSpec {
  id: string;
  /**
   * How the construct is named in the system prompt. English on purpose: the
   * prompt already instructs Nova that programming keywords stay English in
   * both interface languages, and `for` translated into Kazakh is a language
   * that does not exist.
   *
   * Kept SHORT. Every label is billed on every hint request, eighteen learners
   * share one monthly cap, and `tests/nova/privacy-context.test.ts` holds the
   * whole system prompt under a measured ceiling.
   */
  label: string;
  group: ConstructGroup;
  /**
   * On screen from lesson one and not the learner's to write.
   *
   * Only the frame. See the header: this is the fact no walk of shown code can
   * see, and reporting these as "taught" is what let a tutor tell a week-one
   * learner to add a `return`.
   */
  givenAsScaffold?: true;
}

/**
 * Every construct the extractor can recognise.
 *
 * This list is the extractor's alphabet, and its completeness matters in one
 * direction only: a construct that is missing here is invisible to the
 * extractor, so it can neither be reported as available nor as forbidden. It is
 * therefore deliberately wider than anything year one uses — the point is to be
 * able to say "no code this course shows uses `sort()`", which requires knowing
 * `sort()` exists in the first place. The tail of the list is the pedagogy
 * document's own "not in year one" section, present for exactly that reason.
 */
const SPECS = [
  /* --- the frame: given as scaffold, not taught ------------------------ */
  { id: "frame.include", label: "#include", group: "frame", givenAsScaffold: true },
  { id: "frame.using_namespace", label: "using namespace std;", group: "frame", givenAsScaffold: true },
  { id: "frame.main", label: "int main() { }", group: "frame", givenAsScaffold: true },
  { id: "frame.return", label: "return 0;", group: "frame", givenAsScaffold: true },

  /* --- input and output ------------------------------------------------ */
  { id: "io.cout", label: "cout <<", group: "io" },
  { id: "io.cin", label: "cin >>", group: "io" },
  { id: "io.endl", label: "endl", group: "io" },
  { id: "io.getline", label: "getline()", group: "io" },
  { id: "io.precision", label: "setprecision()", group: "io" },
  { id: "io.cstdio", label: "printf()", group: "io" },

  /* --- declared types -------------------------------------------------- */
  { id: "type.int", label: "int", group: "type" },
  { id: "type.long_long", label: "long long", group: "type" },
  { id: "type.double", label: "double", group: "type" },
  { id: "type.char", label: "char", group: "type" },
  { id: "type.bool", label: "bool", group: "type" },
  { id: "type.string", label: "string", group: "type" },
  { id: "type.void", label: "void", group: "type" },
  { id: "type.const", label: "const", group: "type" },
  { id: "type.auto", label: "auto", group: "type" },

  /* --- statements ------------------------------------------------------ */
  { id: "stmt.assign", label: "x = ...", group: "statement" },
  { id: "stmt.compound_assign", label: "x += ...", group: "statement" },
  { id: "stmt.if", label: "if", group: "statement" },
  { id: "stmt.else_if", label: "else if", group: "statement" },
  { id: "stmt.else", label: "else", group: "statement" },
  { id: "stmt.for", label: "for", group: "statement" },
  { id: "stmt.while", label: "while", group: "statement" },
  { id: "stmt.do_while", label: "do/while", group: "statement" },
  { id: "stmt.switch", label: "switch", group: "statement" },
  { id: "stmt.break", label: "break", group: "statement" },
  { id: "stmt.continue", label: "continue", group: "statement" },

  /* --- arithmetic ------------------------------------------------------ */
  { id: "op.add", label: "+", group: "operator" },
  { id: "op.sub", label: "-", group: "operator" },
  { id: "op.mul", label: "*", group: "operator" },
  /* One construct, and the label says why. `7 / 2` is 3 and `7.0 / 2` is 3.5:
     two operations wearing one symbol, taught in two different lessons, and no
     token scan can tell them apart. `schools/nova/cpp17.ts` carries the
     sequencing; this only reports that a slash was on screen. */
  { id: "op.div", label: "/", group: "operator" },
  { id: "op.mod", label: "%", group: "operator" },
  { id: "op.increment", label: "++ / --", group: "operator" },

  /* --- comparison ------------------------------------------------------ */
  { id: "cmp.eq", label: "==", group: "comparison" },
  { id: "cmp.ne", label: "!=", group: "comparison" },
  { id: "cmp.lt", label: "<", group: "comparison" },
  { id: "cmp.gt", label: ">", group: "comparison" },
  { id: "cmp.le", label: "<=", group: "comparison" },
  { id: "cmp.ge", label: ">=", group: "comparison" },
  { id: "cmp.chained", label: "a < x < b", group: "comparison" },

  /* --- logic ----------------------------------------------------------- */
  { id: "logic.and", label: "&&", group: "logic" },
  { id: "logic.or", label: "||", group: "logic" },
  { id: "logic.not", label: "!", group: "logic" },

  /* --- functions of their own ------------------------------------------ */
  { id: "func.define", label: "their own function", group: "function" },
  { id: "func.return", label: "return of a value from it", group: "function" },
  { id: "func.reference_param", label: "int& parameter", group: "function" },
  { id: "func.recursion", label: "recursion", group: "function" },

  /* --- containers ------------------------------------------------------ */
  { id: "cont.array", label: "int a[10]", group: "container" },
  { id: "cont.vector", label: "vector", group: "container" },
  { id: "cont.vector_2d", label: "vector of vectors", group: "container" },
  { id: "cont.pair", label: "pair", group: "container" },
  { id: "cont.queue", label: "queue", group: "container" },
  { id: "cont.stack", label: "stack", group: "container" },
  { id: "cont.deque", label: "deque", group: "container" },
  { id: "cont.priority_queue", label: "priority_queue", group: "container" },
  { id: "cont.map", label: "map", group: "container" },
  { id: "cont.set", label: "set", group: "container" },

  /* --- member calls ---------------------------------------------------- */
  { id: "method.size", label: ".size()", group: "method" },
  { id: "method.push_back", label: ".push_back()", group: "method" },
  { id: "method.pop_back", label: ".pop_back()", group: "method" },
  { id: "method.push_pop", label: ".push() / .pop()", group: "method" },
  { id: "method.front_back", label: ".front() / .back()", group: "method" },
  { id: "method.top", label: ".top()", group: "method" },
  { id: "method.empty", label: ".empty()", group: "method" },
  { id: "method.clear", label: ".clear()", group: "method" },
  { id: "method.resize", label: ".resize()", group: "method" },
  { id: "method.begin_end", label: ".begin() / .end()", group: "method" },
  { id: "method.at", label: ".at()", group: "method" },
  { id: "method.substr", label: ".substr()", group: "method" },
  { id: "method.find", label: ".find()", group: "method" },
  { id: "method.count", label: ".count()", group: "method" },
  { id: "method.insert", label: ".insert()", group: "method" },
  { id: "method.erase", label: ".erase()", group: "method" },

  /* --- the standard library -------------------------------------------- */
  { id: "lib.bits_stdc", label: "bits/stdc++.h", group: "library" },
  { id: "lib.sort", label: "sort()", group: "library" },
  { id: "lib.next_permutation", label: "next_permutation()", group: "library" },
  { id: "lib.binary_search", label: "lower_bound()", group: "library" },
  { id: "lib.max_min", label: "max() / min()", group: "library" },
  { id: "lib.max_element", label: "max_element()", group: "library" },
  { id: "lib.abs", label: "abs()", group: "library" },
  { id: "lib.swap", label: "swap()", group: "library" },
  { id: "lib.reverse", label: "reverse()", group: "library" },
  { id: "lib.accumulate", label: "accumulate()", group: "library" },
  { id: "lib.math", label: "sqrt() / pow()", group: "library" },
  { id: "lib.string_convert", label: "to_string() / stoi()", group: "library" },
  { id: "lib.numeric_limits", label: "INT_MAX", group: "library" },

  /* --- literals -------------------------------------------------------- */
  { id: "literal.int", label: "whole numbers", group: "literal" },
  { id: "literal.double", label: "decimals (3.5)", group: "literal" },
  { id: "literal.str", label: "\"text\"", group: "literal" },
  { id: "literal.char", label: "'c'", group: "literal" },
  { id: "literal.bool", label: "true / false", group: "literal" },

  /* --- expressions ----------------------------------------------------- */
  { id: "expr.subscript", label: "v[i]", group: "expression" },
  { id: "expr.range_for", label: "range-for", group: "expression" },
  { id: "expr.structured_binding", label: "auto [a, b]", group: "expression" },
  { id: "expr.pair_member", label: ".first / .second", group: "expression" },
  { id: "expr.ternary", label: "c ? a : b", group: "expression" },
  { id: "expr.brace_init", label: "{1, 2, 3}", group: "expression" },
  { id: "expr.cast", label: "(int)x", group: "expression" },

  /* --- named so nobody reaches for them by accident --------------------
     `docs/cpp17/CPP17_PEDAGOGY.md` rules these out for the WHOLE of year one,
     which is a stronger statement than "not yet". They are in the alphabet so
     the extractor can say "nothing this course shows uses a class", and so
     `untaughtConstructsIn` can catch one in a proposed answer. */
  { id: "excl.class", label: "class / struct", group: "excluded" },
  { id: "excl.template", label: "template", group: "excluded" },
  { id: "excl.new_delete", label: "new / delete", group: "excluded" },
  { id: "excl.pointer", label: "pointers", group: "excluded" },
  { id: "excl.lambda", label: "lambda", group: "excluded" },
  { id: "excl.exception", label: "try / catch", group: "excluded" },
] as const satisfies readonly ConstructSpec[];

export type ConstructId = (typeof SPECS)[number]["id"];

export const CONSTRUCTS: readonly ConstructSpec[] = SPECS;

const SPEC_BY_ID = new Map<string, ConstructSpec>(SPECS.map((s) => [s.id, s]));

/** The frame, as ids. Held out of `available` until the content asks for it. */
const SCAFFOLD_IDS: ReadonlySet<string> = new Set(
  SPECS.filter((s) => "givenAsScaffold" in s && s.givenAsScaffold).map((s) => s.id),
);

/** Rendering order inside the prompt. Groups, not alphabetical. */
const GROUP_ORDER: ConstructGroup[] = [
  "frame",
  "io",
  "type",
  "statement",
  "operator",
  "comparison",
  "logic",
  "function",
  "container",
  "method",
  "library",
  "literal",
  "expression",
  "excluded",
];

const SPEC_INDEX = new Map<string, number>(SPECS.map((s, i) => [s.id, i]));

function specOrder(a: ConstructSpec, b: ConstructSpec): number {
  const g = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);
  return g !== 0 ? g : (SPEC_INDEX.get(a.id) ?? 0) - (SPEC_INDEX.get(b.id) ?? 0);
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
 * Sentinels that stand in for things the scanner must see as ONE opaque token.
 *
 * A string literal has to survive as a single token so `cout << "a" << "b"`
 * keeps its operators, and it must not look like an identifier, a number or an
 * operator — otherwise the operator scan and the call regex would both trip
 * over it. The template angles are REPLACED rather than removed so that every
 * index into the masked text still lines up with the one before it, which is
 * what lets the `return` classifier ask which function body an offset is in.
 *
 * U+0001..U+0004 are not legal C++ source, so nothing real can collide. They
 * are built from char codes rather than written as literals so that no
 * invisible character ever appears in this file.
 */
const STR = String.fromCharCode(1);
const CHR = String.fromCharCode(2);
const TPL_OPEN = String.fromCharCode(3);
const TPL_CLOSE = String.fromCharCode(4);

interface Masked {
  /** Source with comments, directives and literal bodies removed. */
  text: string;
  sawString: boolean;
  sawChar: boolean;
  /** Header names from `#include <...>`, in order. */
  includes: string[];
}

/**
 * Strip comments, preprocessor directives and literal bodies.
 *
 * This is the half of the extractor that has to be right. Without it, a line
 * printing the text `if x > 5` reports `if` and `>` as taught, and a concept
 * block whose entire body is a Kazakh comment reading
 * `егер a >= 10 болса — 9, 10, 11 үшін тексер` would introduce conditionals a
 * lesson early, out of a line that contains no code at all.
 *
 * C++'s rules, not Python's, and the three that matter here:
 *
 *   - `//` runs to the end of the line and a slash-star pair runs to its
 *     closing star-slash. The Python scanner read `//` as floor division, so
 *     every commented line in the migrated content invented an operator.
 *   - `#` starts a PREPROCESSOR DIRECTIVE, not a comment. It is consumed to the
 *     end of the line — which is also what keeps the angle brackets of
 *     `#include <iostream>` away from the comparison scan — but the header name
 *     is kept, because `<bits/stdc++.h>` is a construct the pedagogy has an
 *     opinion about.
 *   - `'x'` is a character literal, not the start of a string. Reading it as
 *     Python would swallow the rest of the line.
 */
function mask(source: string): Masked {
  let out = "";
  let sawString = false;
  let sawChar = false;
  const includes: string[] = [];
  let atLineStart = true;
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (ch === "#" && atLineStart) {
      let j = i;
      while (j < source.length && source[j] !== "\n") j += 1;
      const inc = /^#\s*include\s*[<"]([^>"]*)[>"]/.exec(source.slice(i, j));
      if (inc) includes.push(inc[1]);
      // The newline is left in place: line structure matters to later scans.
      i = j;
      continue;
    }

    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }

    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      i += 1;
      while (i < source.length) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === quote) {
          i += 1;
          break;
        }
        /* A newline inside an unterminated literal ends it. Authored content is
           well formed; a fragment quoted out of a lesson body may not be, and
           swallowing the rest of the snippet would silently empty it. */
        if (source[i] === "\n") break;
        i += 1;
      }
      if (quote === '"') {
        out += STR;
        sawString = true;
      } else {
        out += CHR;
        sawChar = true;
      }
      atLineStart = false;
      continue;
    }

    if (ch === "\n") {
      atLineStart = true;
      out += ch;
      i += 1;
      continue;
    }
    if (!/\s/.test(ch)) atLineStart = false;
    out += ch;
    i += 1;
  }

  return { text: out, sawString, sawChar, includes };
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(`(^|[^A-Za-z0-9_])${word}(?![A-Za-z0-9_])`).test(text);
}

/** Blank a span in place, keeping every later index where it was. */
function blank(chars: string[], from: number, to: number): void {
  for (let i = Math.max(0, from); i < to && i < chars.length; i += 1) {
    if (chars[i] !== "\n") chars[i] = " ";
  }
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

/**
 * Class templates whose argument list is neutralised before any operator scan.
 *
 * THE reason this exists: `vector<vector<int>> grid;` ends in `>>`, which is
 * the same two characters as `cin >>`. Reading them in source order without
 * this pass reports input on a line that reads nothing, and reports `<` and `>`
 * comparisons on a line that compares nothing. Only a name followed immediately
 * by `<` is considered, so a variable called `set` is safe.
 *
 * Longest name first: `priority_queue` must be tried before `queue` and
 * `unordered_map` before `map`, or the prefix wins and the angle brackets stay.
 */
const TEMPLATE_NAMES = [
  "priority_queue",
  "unordered_map",
  "unordered_set",
  "basic_string",
  "multiset",
  "multimap",
  "function",
  "greater",
  "vector",
  "deque",
  "queue",
  "stack",
  "tuple",
  "array",
  "less",
  "list",
  "pair",
  "map",
  "set",
] as const;

const CONTAINER_OF: Record<string, ConstructId> = {
  vector: "cont.vector",
  pair: "cont.pair",
  queue: "cont.queue",
  priority_queue: "cont.priority_queue",
  stack: "cont.stack",
  deque: "cont.deque",
  map: "cont.map",
  unordered_map: "cont.map",
  multimap: "cont.map",
  set: "cont.set",
  unordered_set: "cont.set",
  multiset: "cont.set",
};

/** Bare `name(` → construct. A name absent from here is a variable or a helper. */
const LIBRARY_CALLS: Record<string, ConstructId> = {
  sort: "lib.sort",
  stable_sort: "lib.sort",
  next_permutation: "lib.next_permutation",
  prev_permutation: "lib.next_permutation",
  lower_bound: "lib.binary_search",
  upper_bound: "lib.binary_search",
  binary_search: "lib.binary_search",
  max: "lib.max_min",
  min: "lib.max_min",
  max_element: "lib.max_element",
  min_element: "lib.max_element",
  abs: "lib.abs",
  llabs: "lib.abs",
  fabs: "lib.abs",
  swap: "lib.swap",
  reverse: "lib.reverse",
  accumulate: "lib.accumulate",
  sqrt: "lib.math",
  pow: "lib.math",
  floor: "lib.math",
  ceil: "lib.math",
  round: "lib.math",
  to_string: "lib.string_convert",
  stoi: "lib.string_convert",
  stoll: "lib.string_convert",
  getline: "io.getline",
  setprecision: "io.precision",
  printf: "io.cstdio",
  scanf: "io.cstdio",
};

/** `.name(` → construct. */
const METHOD_CALLS: Record<string, ConstructId> = {
  size: "method.size",
  length: "method.size",
  push_back: "method.push_back",
  emplace_back: "method.push_back",
  pop_back: "method.pop_back",
  push: "method.push_pop",
  pop: "method.push_pop",
  front: "method.front_back",
  back: "method.front_back",
  top: "method.top",
  empty: "method.empty",
  clear: "method.clear",
  resize: "method.resize",
  assign: "method.resize",
  begin: "method.begin_end",
  end: "method.begin_end",
  rbegin: "method.begin_end",
  rend: "method.begin_end",
  at: "method.at",
  substr: "method.substr",
  find: "method.find",
  count: "method.count",
  insert: "method.insert",
  erase: "method.erase",
};

/** Word → construct, for keywords that mean one thing wherever they appear. */
const KEYWORDS: { word: string; id: ConstructId }[] = [
  { word: "if", id: "stmt.if" },
  { word: "while", id: "stmt.while" },
  { word: "do", id: "stmt.do_while" },
  { word: "switch", id: "stmt.switch" },
  { word: "case", id: "stmt.switch" },
  { word: "break", id: "stmt.break" },
  { word: "continue", id: "stmt.continue" },
  { word: "long", id: "type.long_long" },
  { word: "double", id: "type.double" },
  { word: "float", id: "type.double" },
  { word: "char", id: "type.char" },
  { word: "bool", id: "type.bool" },
  { word: "string", id: "type.string" },
  { word: "void", id: "type.void" },
  { word: "const", id: "type.const" },
  { word: "true", id: "literal.bool" },
  { word: "false", id: "literal.bool" },
  { word: "cout", id: "io.cout" },
  { word: "cerr", id: "io.cout" },
  { word: "cin", id: "io.cin" },
  { word: "endl", id: "io.endl" },
  { word: "fixed", id: "io.precision" },
  { word: "class", id: "excl.class" },
  { word: "struct", id: "excl.class" },
  { word: "template", id: "excl.template" },
  { word: "typename", id: "excl.template" },
  { word: "new", id: "excl.new_delete" },
  { word: "delete", id: "excl.new_delete" },
  { word: "nullptr", id: "excl.pointer" },
  { word: "NULL", id: "excl.pointer" },
  { word: "try", id: "excl.exception" },
  { word: "catch", id: "excl.exception" },
  { word: "throw", id: "excl.exception" },
  { word: "INT_MAX", id: "lib.numeric_limits" },
  { word: "INT_MIN", id: "lib.numeric_limits" },
  { word: "LLONG_MAX", id: "lib.numeric_limits" },
  { word: "LLONG_MIN", id: "lib.numeric_limits" },
  /* `and`, `or` and `not` are real C++ — the alternative tokens for `&&`, `||`
     and `!` — and are also exactly what a half-migrated Python snippet leaves
     behind. Both readings want the same construct reported. */
  { word: "and", id: "logic.and" },
  { word: "or", id: "logic.or" },
  { word: "not", id: "logic.not" },
];

/**
 * Longest match first, or `<=` reports `<` and `=` and invents an assignment.
 *
 * The order of the first two entries is the whole point of this table. `<<` and
 * `>>` are STREAM operators and are consumed before anything can read them as
 * two comparisons — the single defect that made the Python scanner dangerous on
 * this curriculum, because `cout << x` is the first line of C++ the course
 * shows and it was reporting a comparison operator September does not teach
 * until lesson eight.
 */
const OPERATORS: { token: string; ids: ConstructId[] }[] = [
  { token: "<<", ids: ["io.cout"] },
  { token: ">>", ids: ["io.cin"] },
  { token: "<=", ids: ["cmp.le"] },
  { token: ">=", ids: ["cmp.ge"] },
  { token: "==", ids: ["cmp.eq"] },
  { token: "!=", ids: ["cmp.ne"] },
  { token: "&&", ids: ["logic.and"] },
  { token: "||", ids: ["logic.or"] },
  { token: "++", ids: ["op.increment"] },
  { token: "--", ids: ["op.increment"] },
  { token: "->", ids: ["excl.pointer"] },
  { token: "+=", ids: ["stmt.compound_assign", "op.add"] },
  { token: "-=", ids: ["stmt.compound_assign", "op.sub"] },
  { token: "*=", ids: ["stmt.compound_assign", "op.mul"] },
  { token: "/=", ids: ["stmt.compound_assign", "op.div"] },
  { token: "%=", ids: ["stmt.compound_assign", "op.mod"] },
  { token: "::", ids: [] },
  { token: "<", ids: ["cmp.lt"] },
  { token: ">", ids: ["cmp.gt"] },
  { token: "=", ids: ["stmt.assign"] },
  { token: "!", ids: ["logic.not"] },
  { token: "?", ids: ["expr.ternary"] },
  { token: "+", ids: ["op.add"] },
  { token: "-", ids: ["op.sub"] },
  { token: "*", ids: ["op.mul"] },
  { token: "/", ids: ["op.div"] },
  { token: "%", ids: ["op.mod"] },
];

/** Words that may sit in front of a `(` without opening a function definition. */
const NOT_A_FUNCTION_NAME = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "return",
  "else",
  "do",
  "sizeof",
]);

/** The first word of a definition's return type, so `a b(c) {` is not one. */
const RETURN_TYPE_HEADS = new Set([
  "int",
  "long",
  "short",
  "double",
  "float",
  "char",
  "bool",
  "void",
  "string",
  "auto",
  "unsigned",
  "signed",
  "size_t",
  "const",
  "static",
  "inline",
  "vector",
  "pair",
  "queue",
  "stack",
  "deque",
  "map",
  "set",
]);

interface FunctionDef {
  name: string;
  /** Index of the whole signature's first character. */
  from: number;
  /** Index of the `{` that opens the body. */
  bodyStart: number;
  /** Index of the `}` that closes it, or the end of the text. */
  bodyEnd: number;
  params: string;
}

/**
 * A `TYPE name(params) {` definition, anywhere in the snippet.
 *
 * Two things depend on getting this right, and they pull in opposite
 * directions. `int main()` must NOT count as "the learner defined a function" —
 * the frame is given to them, and reporting `func.define` from lesson one would
 * tell Nova that a fourteen-year-old in week one may be handed a helper
 * function. And a genuine `int digit_sum(int n) {` must count, because November
 * is where that arrives and October must not be told it already has it.
 *
 * So the signature is matched, the NAME is checked against the keywords that
 * can also precede a `(` (`else if (...)` otherwise reads as a function called
 * `if`), and the return type's first word is checked against the types this
 * course uses. Everything else is left alone.
 */
function functionDefs(text: string): FunctionDef[] {
  const out: FunctionDef[] = [];
  /* Built rather than written as a literal: the return type may contain a
     neutralised template argument list, whose sentinels are non-printing. */
  const re = new RegExp(
    `^[ \\t]*([A-Za-z_][A-Za-z0-9_${TPL_OPEN}${TPL_CLOSE},&*\\s]*?)[ \\t*&]+([A-Za-z_][A-Za-z0-9_]*)[ \\t]*\\(`,
    "gm",
  );
  for (const m of text.matchAll(re)) {
    const returnType = m[1];
    const name = m[2];
    if (NOT_A_FUNCTION_NAME.has(name)) continue;
    const head = /^[A-Za-z_][A-Za-z0-9_]*/.exec(returnType.trim())?.[0] ?? "";
    if (!RETURN_TYPE_HEADS.has(head)) continue;

    const openParen = m.index + m[0].length - 1;
    const closeParen = matchingBracket(text, openParen);
    if (closeParen < 0) continue;

    // A definition, not a call or a prototype: the next thing is a body.
    let b = closeParen + 1;
    while (b < text.length && /\s/.test(text[b])) b += 1;
    if (text[b] !== "{") continue;

    const bodyEnd = matchingBracket(text, b);
    out.push({
      name,
      from: m.index + (m[0].length - m[0].trimStart().length),
      bodyStart: b,
      bodyEnd: bodyEnd < 0 ? text.length : bodyEnd,
      params: text.slice(openParen + 1, closeParen),
    });
  }
  return out;
}

/**
 * Every construct a snippet of code uses.
 *
 * Not a parser. A parser would be better and is not available in this runtime,
 * so this is a masked-source scanner, and its two directions of error are not
 * symmetric.
 *
 * MISSING a construct in curriculum code is the harmless direction: the set of
 * available constructs comes out too small, so Nova is told to use less than
 * the learner has actually seen. INVENTING one is the harmful direction: it
 * widens `available`, and Nova gets told a construct is taught when it is not —
 * the exact bug this module exists to fix, and the exact bug a Python scanner
 * walking C++ committed four times on the first block of the year.
 *
 * So the order below is not arbitrary. Comments and literals go first, then the
 * preprocessor, then the frame, then template argument lists, and only then is
 * anything read as an operator. Each of those passes exists to stop a later one
 * lying.
 */
export function extractConstructs(source: string): Set<ConstructId> {
  const found = new Set<ConstructId>();
  const m = mask(source);

  if (m.sawString) found.add("literal.str");
  if (m.sawChar) found.add("literal.char");
  for (const header of m.includes) {
    found.add("frame.include");
    if (header.startsWith("bits/")) found.add("lib.bits_stdc");
  }

  const chars = [...m.text];

  /* -- the frame ------------------------------------------------------- */

  /* `using namespace std;` is blanked rather than read word by word: `std` and
     `namespace` mean nothing on their own here, and leaving them in would have
     the call scan trip over the qualified names below. */
  for (const u of m.text.matchAll(/using\s+namespace\s+std\s*;/g)) {
    found.add("frame.using_namespace");
    blank(chars, u.index, u.index + u[0].length);
  }
  /* A `std::` qualifier is the same fact as the `using` line — the learner is
     inside the standard namespace — but the NAME after it must survive, so only
     the qualifier goes. */
  for (const q of m.text.matchAll(/std\s*::/g)) {
    found.add("frame.using_namespace");
    blank(chars, q.index, q.index + q[0].length);
  }

  /* Template argument lists, before any operator is read. See TEMPLATE_NAMES:
     this is what stops `vector<vector<int>>` reporting `cin >>`. */
  neutraliseTemplates(chars, found);

  const defs = functionDefs(chars.join(""));
  const mainDefs: FunctionDef[] = [];
  for (const def of defs) {
    if (def.name === "main") {
      /* The frame, not a function the learner wrote. The whole signature is
         blanked so its `int` is not reported as a declared type either — a
         learner at lesson one has `int main()` on screen and has not been
         taught `int`. */
      found.add("frame.main");
      mainDefs.push(def);
      blank(chars, def.from, def.bodyStart);
      continue;
    }
    found.add("func.define");
    if (def.params.includes("&")) found.add("func.reference_param");
    /* A call to its own name inside its own body. The only way to see recursion
       without a call graph, and it is exactly the shape the course teaches. */
    const body = chars.join("").slice(def.bodyStart, def.bodyEnd);
    if (new RegExp(`(^|[^A-Za-z0-9_])${def.name}\\s*\\(`).test(body)) {
      found.add("func.recursion");
    }
    /* The name is blanked so the call scan does not read the definition itself
       as a call — a helper the learner defines and names `sort` would otherwise
       report `sort()` from <algorithm>. The body's calls survive, which is what
       the recursion test above has already used. */
    const nameAt = chars.join("").indexOf(def.name, def.from);
    if (nameAt >= 0 && nameAt < def.bodyStart) blank(chars, nameAt, nameAt + def.name.length);
  }

  /* `return` belongs to whoever it is inside.
   *
   * `return 0;` at the end of `main` is the frame — given to the learner in
   * every starter from lesson one, and not theirs to write until the lesson
   * that asks for the whole program. `return x;` inside a function they wrote
   * is November's skill. Reporting them as the same construct is what told Nova
   * a week-one learner already knew `return`.
   *
   * `return 0;` is blanked once recognised, so the `0` in it does not report a
   * whole-number literal either. The whole four-line frame has to be inert, not
   * merely mostly inert: `cout << "Сәлем!";` is the only thing lesson one
   * teaches, and a frame that leaks one construct is a frame that will leak
   * another the next time somebody edits the starter. */
  const beforeReturns = chars.join("");
  for (const r of beforeReturns.matchAll(/(^|[^A-Za-z0-9_])return(?![A-Za-z0-9_])/g)) {
    const at = r.index + r[0].length - "return".length;
    const rest = beforeReturns.slice(at + "return".length);
    const isReturnZero = /^\s*0\s*;/.test(rest);
    const inMain = mainDefs.some((d) => at > d.bodyStart && at < d.bodyEnd);
    const inOwn = defs.some(
      (d) => d.name !== "main" && at > d.bodyStart && at < d.bodyEnd,
    );
    /* A fragment with no frame around it: `return 0;` is still the frame's
       return, anything else is a value coming back out of something. */
    if (inMain || (!inOwn && isReturnZero)) {
      found.add("frame.return");
      if (isReturnZero) {
        blank(chars, at, at + "return".length + (/^\s*0\s*;/.exec(rest)?.[0].length ?? 0));
      }
    } else {
      found.add("func.return");
    }
  }

  const text = chars.join("");

  /* -- keywords -------------------------------------------------------- */

  for (const { word, id } of KEYWORDS) {
    if (hasWord(text, word)) found.add(id);
  }
  /* `long long` and a lone `long` are the same construct here; the KEYWORDS
     entry above already covers both, and the label says `long long` because
     that is the one the course teaches. */

  /* `else if` is its own lesson, and `else` on its own is a different one. A
     single `else` keyword scan would report both from either. */
  if (/(^|[^A-Za-z0-9_])else\s+if(?![A-Za-z0-9_])/.test(text)) found.add("stmt.else_if");
  if (/(^|[^A-Za-z0-9_])else(?!\s+if(?![A-Za-z0-9_]))(?![A-Za-z0-9_])/.test(text)) {
    found.add("stmt.else");
  }

  /* -- for, and the range-for that is a different idea ----------------- */

  const rangeForHeaders: [number, number][] = [];
  for (const f of text.matchAll(/(^|[^A-Za-z0-9_])for\s*\(/g)) {
    found.add("stmt.for");
    const open = f.index + f[0].length - 1;
    const close = matchingBracket(text, open);
    if (close < 0) continue;
    const header = text.slice(open + 1, close);
    /* A colon in the header and no `?` in front of it: `for (int x : v)`
       rather than a ternary that happens to be inside a classic for. */
    if (header.includes(":") && !header.includes("?")) {
      found.add("expr.range_for");
      rangeForHeaders.push([open, close]);
    }
  }

  /* `auto` is allowed as the loop variable of a range-for and nowhere else in
     year one, so the two readings are separated rather than merged. */
  for (const a of text.matchAll(/(^|[^A-Za-z0-9_])auto(?![A-Za-z0-9_])/g)) {
    const at = a.index + a[0].length - "auto".length;
    const inRangeFor = rangeForHeaders.some(([open, close]) => at > open && at < close);
    if (!inRangeFor) found.add("type.auto");
  }
  /* `int` is read only where it declares something. `int main()` has already
     been blanked, so what is left is `int n;`, `int a, b;`, a parameter, or a
     cast — all of them the learner meeting a declared type. */
  if (hasWord(text, "int")) found.add("type.int");
  if (hasWord(text, "unsigned")) found.add("type.int");
  if (hasWord(text, "size_t")) found.add("type.int");

  /* -- operators, longest match first ---------------------------------- */

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

  /* -- calls ----------------------------------------------------------- */

  for (const match of text.matchAll(/(\.\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
    const isMethod = Boolean(match[1]);
    const name = match[2];
    const id = isMethod ? METHOD_CALLS[name] : LIBRARY_CALLS[name];
    if (id) found.add(id);
  }
  if (/\.\s*(first|second)(?![A-Za-z0-9_])/.test(text)) found.add("expr.pair_member");

  /* -- brackets --------------------------------------------------------- */

  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "[") continue;
    let j = i - 1;
    while (j >= 0 && /\s/.test(text[j])) j -= 1;
    const prev = j >= 0 ? text[j] : "";
    /* The `&` of `auto& [k, v]` is part of the declaration, not a token in its
       own right, so it is stepped over before the preceding word is read. */
    const beforeBracket = text.slice(0, j + 1).replace(/[&*]\s*$/, "");
    const word = /([A-Za-z_][A-Za-z0-9_]*)$/.exec(beforeBracket)?.[1] ?? "";
    const close = matchingBracket(text, i);
    const inner = close > i ? text.slice(i + 1, close) : "";

    /* `auto [a, b] = ...` and `for (auto [k, v] : m)`. The brackets belong to
       the binding, not to a subscript. */
    if (word === "auto") {
      found.add("expr.structured_binding");
      continue;
    }
    /* A capture list: `[](int x) { ... }`, `[&]`, `[=]`. A lambda is out of
       bounds for the whole of year one and is named so it can be caught. */
    if (close > i) {
      let k = close + 1;
      while (k < text.length && /\s/.test(text[k])) k += 1;
      if (text[k] === "(" && (inner.trim() === "" || /^[&=]/.test(inner.trim()))) {
        found.add("excl.lambda");
        continue;
      }
    }
    if (/[A-Za-z0-9_)\]]/.test(prev) || prev === STR) found.add("expr.subscript");
  }

  /* A C array declaration, which is a different thing from indexing a vector:
     `int a[10];` puts the size in the brackets at the point of declaration. */
  if (/(^|[^A-Za-z0-9_])(int|long|double|float|char|bool|string)\s+[A-Za-z_][A-Za-z0-9_]*\s*\[/.test(text)) {
    found.add("cont.array");
  }

  /* Brace INITIALISATION, not a block. `{` after `=`, `(`, `,` or another `{`
     builds a value; `{` after `)` or a statement opens a body. In Python the
     same character was a dict or set literal, which is how `int main() { }`
     came to report "a dict or set" as taught in week one. */
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "{") continue;
    let j = i - 1;
    while (j >= 0 && /\s/.test(text[j])) j -= 1;
    const prev = j >= 0 ? text[j] : "";
    if (prev === "=" || prev === "," || prev === "(" || prev === "{") {
      found.add("expr.brace_init");
      break;
    }
  }

  /* -- casts ------------------------------------------------------------ */

  if (/\(\s*(int|long\s+long|long|double|float|char|bool)\s*\)\s*[A-Za-z_(]/.test(text)) {
    found.add("expr.cast");
  }
  if (/(^|[^A-Za-z0-9_])(static_cast|reinterpret_cast|const_cast|dynamic_cast)\s*</.test(text)) {
    found.add("expr.cast");
  }

  /* -- pointers --------------------------------------------------------- */

  if (/(^|[^A-Za-z0-9_])(int|long|double|float|char|bool|void)\s*\*\s*[A-Za-z_]/.test(text)) {
    found.add("excl.pointer");
  }

  /* -- numbers ---------------------------------------------------------- */

  // Decimals first, or `3.5` reports two whole numbers.
  let numeric = text;
  if (/\d+\.\d+/.test(numeric)) {
    found.add("literal.double");
    numeric = numeric.replace(/\d+\.\d+/g, " ");
  }
  if (/(^|[^A-Za-z0-9_.])\d+/.test(numeric)) found.add("literal.int");

  /* -- the chained comparison -------------------------------------------
   *
   * `10 <= x <= 20` is legal C++ that means something the learner did not
   * intend — it compares a bool against a number — and it is exactly the
   * "obvious" spelling a beginner reaches for. Worth naming so a hint never
   * offers it.
   *
   * It is also where the Python scanner did its worst work: `cin >> a >> b`
   * was two `>` to it, so every input line in the course reported a chained
   * comparison. Here the stream operators are removed FIRST, the text is cut at
   * every boundary that separates one comparison from another — `;`, `,`, `&&`,
   * `||`, `?`, braces and newlines — and only two relational operators left
   * inside a single fragment count. */
  const relational = text
    .split(TPL_OPEN)
    .join(" ")
    .split(TPL_CLOSE)
    .join(" ")
    .replace(/<<|>>/g, "  ");
  for (const segment of relational.split(/;|,|&&|\|\||\?|\{|\}|\n/)) {
    if (hasWord(segment, "and") || hasWord(segment, "or")) continue;
    const ops = segment.match(/<=|>=|==|!=|<|>/g);
    if (ops && ops.length >= 2) {
      found.add("cmp.chained");
      break;
    }
  }

  return found;
}

/**
 * Replace the angle brackets of every template argument list with sentinels,
 * recording the container each one names.
 *
 * Done in place on the character array so indices stay put. Nested lists are
 * handled by depth counting rather than by recursion, and a `>>` closing two of
 * them at once is two closers — the case that makes this pass necessary.
 */
function neutraliseTemplates(chars: string[], found: Set<ConstructId>): void {
  const text = chars.join("");
  for (const name of TEMPLATE_NAMES) {
    /* The word boundary is checked by hand rather than matched, because a
       matched one CONSUMES the character before the name — and in
       `vector<vector<int>>` that character is the outer `<`, so the inner list
       would never be found and its `<` and `>` would survive into the operator
       scan as a comparison. That is the exact bug this pass exists to stop, so
       it must not reappear inside the pass itself. */
    const re = new RegExp(`${name}\\s*<`, "g");
    for (const m of text.matchAll(re)) {
      const before = m.index > 0 ? text[m.index - 1] : "";
      if (/[A-Za-z0-9_]/.test(before)) continue;
      const open = m.index + m[0].length - 1;
      if (chars[open] !== "<") continue; // already neutralised by an outer list
      let depth = 0;
      let i = open;
      for (; i < chars.length; i += 1) {
        if (chars[i] === "<") depth += 1;
        else if (chars[i] === ">") {
          depth -= 1;
          if (depth === 0) break;
        } else if (chars[i] === ";" || chars[i] === "\n") {
          /* Unbalanced: this was a comparison after all, or a fragment cut off
             mid-declaration. Leave every character alone rather than eat a
             relational operator. */
          depth = -1;
          break;
        }
      }
      if (depth !== 0) continue;
      const inner = chars.slice(open + 1, i).join("");
      chars[open] = TPL_OPEN;
      chars[i] = TPL_CLOSE;
      const id = CONTAINER_OF[name];
      if (id) found.add(id);
      if (id === "cont.vector") {
        /* A vector whose elements are themselves vectors — the grid October
           and March build, and a different idea from a list of numbers. Both
           spellings of the inner opening bracket count, because an inner list
           may already have been neutralised by an earlier pass. */
        const nested = new RegExp(`(^|[^A-Za-z0-9_])vector\\s*[<${TPL_OPEN}]`);
        if (nested.test(inner)) found.add("cont.vector_2d");
      }
    }
  }
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
 *
 * Note that the lesson NUMBER in a block id is not its position: September's
 * order is l1, l11, l2, l10, l3, l4, l5, l12, l6, l7, l8, l9, because the ids
 * were kept when the units were re-sequenced. Anything that wants "how far in
 * are they" must count this array rather than parse the id.
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
 * The code this block puts in front of the learner.
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
      // The template with `___` in it is not a program. Filled in, it is — and
      // the filled-in form is what `revealFor` shows.
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
 * The code this block's answer needs, which the learner never sees.
 *
 * Read for two purposes: to notice when a task's own solution requires
 * something the curriculum has not shown (see `taskGap`), and to find the point
 * at which the frame stops being scaffold (see `frameBecomesTheirsAt`).
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
/* The frame stops being scaffold                                             */
/* -------------------------------------------------------------------------- */

let frameOrdinalCache: number | null = null;

/**
 * The teaching-order position at which the frame becomes the learner's.
 *
 * DERIVED, not declared. It is the first block whose answer needs a frame
 * construct that the block itself does not put on screen — in practice, the
 * first `write_code` with no starter, where the editor opens empty and the
 * learner types `#include <iostream>` themselves. Before that point every task
 * hands them the frame already written.
 *
 * `schools/nova/cpp17.ts` states the same fact as a declaration: its `frame`
 * row carries `taughtAt: 1` and `requiredAt: 7`, transcribed from the binding
 * table in `docs/cpp17/CPP17_PEDAGOGY.md`. That number is deliberately NOT
 * copied here. Two statements of one fact drift; one of them is derived from
 * the content and the other from the document, and where they disagree the
 * disagreement is worth seeing rather than averaging.
 *
 * They do currently disagree, and it is a finding about the content: the first
 * starter-less task in teaching order sits in the FOURTH lesson of September,
 * not the seventh. This function reports what the content does. If the content
 * is wrong, the content is what changes.
 *
 * `Infinity` if the programme never asks — which would mean the frame is
 * scaffold for the whole year, and the constructs stay out of `available`
 * everywhere. Failing closed is the safe direction here: the cost is a hint
 * that declines to tell a learner to write `return 0;` themselves.
 */
export function frameBecomesTheirsAt(): number {
  if (frameOrdinalCache !== null) return frameOrdinalCache;
  frameOrdinalCache = Number.POSITIVE_INFINITY;
  for (const entry of teachingOrder()) {
    const shown = new Set<ConstructId>();
    for (const code of shownCode(entry.block)) {
      for (const id of extractConstructs(code)) shown.add(id);
    }
    let needsIt = false;
    for (const code of hiddenCode(entry.block)) {
      for (const id of extractConstructs(code)) {
        if (SCAFFOLD_IDS.has(id) && !shown.has(id)) needsIt = true;
      }
    }
    if (needsIt) {
      frameOrdinalCache = entry.ordinal;
      break;
    }
  }
  return frameOrdinalCache;
}

/* -------------------------------------------------------------------------- */
/* What arrives later — the declaration that is left, and its validator       */
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
 * Constructs the programme teaches later than any code of its own shows them.
 *
 * **This used to be the only hand-written thing in the file, and it used to
 * hold fifteen entries.** The reason it held them is written in this module's
 * header: months 2–9 carried their structure but their lesson bodies were
 * unauthored, so October contained no code and "a `for` loop arrives in
 * October" was not extractable from October.
 *
 * All nine months are authored now. The month a construct is first put on
 * screen is a fact about the tree, `firstShownMonth()` reads it, and every
 * declaration whose month could be read off the content that way has been
 * deleted rather than left to agree with the content until it quietly stops.
 *
 * ## Nothing is left, and this is the evidence rather than an omission
 *
 * Every one of the fifteen was checked against the tree before it was deleted.
 * The derived month is not merely close to the declared one; for every entry
 * that still has a C++ counterpart it is the SAME month the declaration's skill
 * names, which is the strongest possible argument that the declaration had
 * stopped carrying information:
 *
 *   declared via          construct now            skill month   first shown
 *   loops.for             for                      m2            m2
 *   loops.while           while                    m2            m2
 *   loops.while           break                    m2            m2
 *   lists.index           vector                   m2            m2
 *   lists.index           indexing v[i]            m2            m2
 *   lists.traverse        .size()                  m2            m2
 *   func.define           their own function       m3            m3
 *   func.return           return of a value        m3            m3
 *   sort.basic            sort()                   m4            m4
 *
 * Four had no C++ counterpart to keep — `range()`, `list()`, a comprehension
 * and a slice are Python, and the last of them is now `.substr()`, first shown
 * in m6 while string indexing arrives in m2.
 *
 * The fifteenth was `continue`, declared via `loops.while`. It is deleted for
 * the opposite reason: no code anywhere in the nine months shows one, so it
 * belongs in `neverShown`, where the statement made about it — "no code this
 * course shows uses this" — is true all year. A declaration would have said
 * "arrives in October" and then said nothing at all from October onwards.
 *
 * ## What would go back in here
 *
 * A construct the programme genuinely teaches and genuinely never writes as
 * code, where saying "never shown" would mislead. Nothing meets that bar today.
 * Anything added is still checked by `validateArrivalDeclarations()`: the skill
 * must exist, the construct must exist, and the construct must not already
 * appear in code shown before the month the skill puts it in.
 */
export const ARRIVES_LATER: readonly ArrivalDeclaration[] = [];

export interface DeclarationProblem {
  construct: string;
  problem: string;
}

/**
 * Refuse declarations that contradict the curriculum.
 *
 * The failure it is looking for is the one that makes hand-maintained tables
 * dangerous: a construct declared to arrive in month N that the content already
 * shows in month N-1, so Nova is told the learner has not met something they
 * have been staring at for a month.
 *
 * When months 2–9 held no code this check was a formality. They are authored
 * now, so it is a real one, and it is why `ARRIVES_LATER` is nearly empty: a
 * declaration whose month can be READ OFF the tree is not a declaration worth
 * keeping.
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
    const first = firstShownMonth().get(decl.construct);
    if (first !== undefined && first < skill.introducedInMonth) {
      problems.push({
        construct: decl.construct,
        problem:
          `declared to arrive in month ${skill.introducedInMonth} via ${decl.skill}, ` +
          `but the curriculum already shows it in month ${first}`,
      });
    }
  }

  return problems;
}

/* -------------------------------------------------------------------------- */
/* The capability context                                                     */
/* -------------------------------------------------------------------------- */

let firstShownCache: Map<ConstructId, number> | null = null;

/**
 * The month each construct is first put on screen, read off the tree.
 *
 * This is what replaced most of `ARRIVES_LATER`. Months 2–9 used to contain no
 * code, so "a `for` loop arrives in October" had to be declared; they are
 * authored now, so it is a fact this walk can state, and a fact cannot go stale
 * against the content it was read from.
 */
export function firstShownMonth(): ReadonlyMap<ConstructId, number> {
  if (firstShownCache) return firstShownCache;
  const out = new Map<ConstructId, number>();
  for (const entry of teachingOrder()) {
    for (const code of shownCode(entry.block)) {
      for (const id of extractConstructs(code)) {
        if (!out.has(id)) out.set(id, entry.monthIndex);
      }
    }
  }
  firstShownCache = out;
  return out;
}

export interface ArrivingConstruct {
  spec: ConstructSpec;
  month: number;
  /**
   * The skill that brings it when the arrival is DECLARED, and null when it is
   * derived from the content — which is now the usual case. A reader who wants
   * to check a derived claim reads the month's code; a reader who wants to
   * check a declared one reads `skills.ts`.
   */
  skill: SkillId | null;
}

export interface CapabilityContext {
  blockId: string;
  monthIndex: number;
  /** Everything the curriculum has shown, up to and including this block. */
  available: ConstructSpec[];
  /**
   * On screen and not theirs to write.
   *
   * The frame, and only the frame, and only until `frameBecomesTheirsAt()`. A
   * learner at their third lesson has `#include <iostream>`, `int main()` and
   * `return 0;` in front of them in every starter, and a tutor may point at
   * them, name them and explain what they are for. What it may not do is ask
   * for them, or treat them as something the learner already knows how to
   * produce — "just add a return statement" to somebody in week one is the
   * exact failure this list exists to prevent.
   */
  givenAsScaffold: ConstructSpec[];
  /** Shown for the first time in a later month. Ordered by month. */
  arrivesLater: ArrivingConstruct[];
  /**
   * In the extractor's vocabulary, shown nowhere in the programme's code, and
   * not declared to arrive later.
   *
   * The name is exact and the exactness matters. This is NOT "the programme
   * never teaches it": a construct can be introduced in a concept's prose, in
   * backticks, and never appear in a `code` field, and this walk reads `code`
   * fields alone. The claim being made is only ever "they have not seen this
   * written down as a program", which is the claim the extraction supports.
   * Saying anything stronger in the prompt would be inventing curriculum.
   */
  neverShown: ConstructSpec[];
  /**
   * What this task's own reference solution needs that the curriculum has never
   * shown — the frame excepted, because the frame is on screen even while it is
   * not theirs.
   *
   * Almost always empty, and when it is not, it is a finding rather than a
   * feature. Surfacing it is the point — the alternative is Nova being
   * forbidden from giving the level-4 fix to a task whose only sane fix needs
   * the construct, and nobody ever learning that the gap is there.
   */
  taskGap: ConstructSpec[];
}

let contextCache: Map<string, CapabilityContext> | null = null;

function buildContexts(): Map<string, CapabilityContext> {
  const order = teachingOrder();
  const firstMonth = firstShownMonth();
  const frameAt = frameBecomesTheirsAt();

  const declared = new Map<ConstructId, ArrivalDeclaration>();
  for (const decl of ARRIVES_LATER) declared.set(decl.construct, decl);

  const shownEver = new Set<ConstructId>(firstMonth.keys());
  const neverShownIds = SPECS.map((s) => s.id).filter(
    (id) => !shownEver.has(id) && !declared.has(id),
  );
  const neverShown = specsOf(neverShownIds);

  const out = new Map<string, CapabilityContext>();
  const running = new Set<ConstructId>();

  for (const entry of order) {
    for (const code of shownCode(entry.block)) {
      for (const id of extractConstructs(code)) running.add(id);
    }

    /* The frame is held back until the content asks the learner to produce it.
       Everything else that has been shown is theirs. */
    const frameIsTheirs = entry.ordinal >= frameAt;
    const available = new Set<ConstructId>();
    const scaffold = new Set<ConstructId>();
    for (const id of running) {
      if (!frameIsTheirs && SCAFFOLD_IDS.has(id)) scaffold.add(id);
      else available.add(id);
    }

    /* Arrivals: derived from the tree wherever the tree shows the construct,
       declared only where it does not. */
    const arrivals: ArrivingConstruct[] = [];
    for (const spec of SPECS) {
      const id = spec.id as ConstructId;
      if (available.has(id) || scaffold.has(id)) continue;
      const decl = declared.get(id);
      if (decl) {
        const skill = SKILL_BY_ID.get(decl.skill);
        if (skill && skill.introducedInMonth > entry.monthIndex) {
          arrivals.push({ spec, month: skill.introducedInMonth, skill: decl.skill });
        }
        continue;
      }
      const month = firstMonth.get(id);
      if (month !== undefined && month > entry.monthIndex) {
        arrivals.push({ spec, month, skill: null });
      }
    }
    arrivals.sort((a, b) => a.month - b.month || specOrder(a.spec, b.spec));

    /* The frame is on screen whether or not it is theirs, so a solution that
       uses it is not reaching past the curriculum. */
    const onScreen = new Set<ConstructId>([...available, ...scaffold]);
    const gap = new Set<ConstructId>();
    for (const code of hiddenCode(entry.block)) {
      for (const id of extractConstructs(code)) {
        if (!onScreen.has(id)) gap.add(id);
      }
    }

    out.set(entry.block.id, {
      blockId: entry.block.id,
      monthIndex: entry.monthIndex,
      available: specsOf(available),
      givenAsScaffold: specsOf(scaffold),
      arrivesLater: arrivals,
      neverShown: neverShown.filter((s) => !onScreen.has(s.id as ConstructId)),
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
 * task's own reference solution defines what that task requires, and so is the
 * frame, which is on screen from the first lesson.
 *
 * Pure, and takes the context rather than a block id, so a test can point it at
 * any snippet and any point in the curriculum.
 */
export function untaughtConstructsIn(code: string, ctx: CapabilityContext): ConstructSpec[] {
  const allowed = new Set<string>([
    ...ctx.available.map((s) => s.id),
    ...ctx.givenAsScaffold.map((s) => s.id),
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
export const CAPABILITY_PROMPT_HEADING =
  "WHICH CONSTRUCTS THIS LEARNER HAS ACTUALLY BEEN SHOWN";

export interface CapabilityPromptOptions {
  /**
   * Whether Nova may be told what this task's own solution needs beyond the
   * taught set.
   *
   * False below hint level 3. "This one needs sort()" is a substantial hint
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
 *
 * Terse on purpose. `schools/nova/cpp17.ts` already tells the model that a
 * longer solution built from what they know is the correct one, and that
 * explaining an untaught construct is allowed while solving with it is not;
 * saying it twice costs input tokens on every request out of a cap eighteen
 * learners share, and `tests/nova/privacy-context.test.ts` holds the whole
 * prompt under a measured ceiling.
 */
export function capabilityPromptLines(
  ctx: CapabilityContext,
  opts: CapabilityPromptOptions,
): string[] {
  const lines: string[] = [
    "",
    CAPABILITY_PROMPT_HEADING,
    "- Computed from the code this course has put on screen up to this task. Not a guess.",
    `- TAUGHT, use freely: ${joinLabels(ctx.available)}`,
  ];

  if (ctx.givenAsScaffold.length) {
    lines.push(
      `- ON SCREEN but NOT theirs to write: ${joinLabels(ctx.givenAsScaffold)}.`,
      "  Point at it and explain it; never ask them to produce it.",
    );
  }
  if (ctx.arrivesLater.length) {
    /* Grouped by month rather than annotated per item. Thirty-nine repetitions
       of "(m2)" is a third of this line, and the model reads "m2: a, b, c" at
       least as well. */
    const byMonth = new Map<number, string[]>();
    for (const a of ctx.arrivesLater) {
      const bucket = byMonth.get(a.month) ?? [];
      bucket.push(a.spec.label);
      byMonth.set(a.month, bucket);
    }
    const grouped = [...byMonth.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([month, labels]) => `m${month}: ${labels.join(", ")}`)
      .join(" · ");
    lines.push(`- NOT YET — first shown in a later month: ${grouped}`);
  }
  if (ctx.neverShown.length) {
    lines.push(`- NEVER SHOWN in this course's code: ${joinLabels(ctx.neverShown)}`);
  }

  lines.push(
    /* "closed" verbatim: `tests/nova/construct-context.test.ts` asserts this
       exact phrase as the marker that the capability block is back in the
       prompt, so the sentence is a contract as well as an instruction. */
    "- The TAUGHT list is closed. Anything not on it counts as not taught, named or not,",
    "  in code you write, in code you describe in words, and in asides.",
  );

  if (opts.includeTaskGap && ctx.taskGap.length) {
    lines.push(
      `- EXCEPTION, this task only: its intended solution also needs ${joinLabels(ctx.taskGap)}.`,
      "  Use those here and only here, and explain them — they have not been taught.",
    );
  }

  return lines;
}
